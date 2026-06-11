const cron = require('node-cron');
const { Op } = require('sequelize');
const {
  Milestone, Case, User, ReminderRule, Notification
} = require('../models');
const { getToday, addDays, getDaysDiff } = require('../utils/helpers');

async function checkDeadlinesAndNotify() {
  console.log(`[${new Date().toISOString()}] 开始执行超期提醒检查...`);

  try {
    const rules = await ReminderRule.findAll({ where: { is_enabled: 1 } });
    if (rules.length === 0) {
      console.log('没有启用的提醒规则');
      return;
    }

    const today = new Date(getToday());
    const milestones = await Milestone.findAll({
      where: {
        status: { [Op.in]: ['pending', 'in_progress', 'delayed'] },
        deadline_date: { [Op.not]: null }
      },
      include: [
        { model: Case, as: 'case_info', where: { is_deleted: 0 }, required: true }
      ]
    });

    for (const milestone of milestones) {
      if (!milestone.case_info) continue;

      const deadlineDate = new Date(milestone.deadline_date);
      const daysUntilDeadline = getDaysDiff(today, deadlineDate);

      for (const rule of rules) {
        const shouldNotify = determineNotification(rule, daysUntilDeadline, milestone);
        if (!shouldNotify) continue;

        await sendReminderNotifications(milestone, rule, daysUntilDeadline);
      }

      if (daysUntilDeadline < 0 && milestone.status !== 'delayed') {
        milestone.status = 'delayed';
        await milestone.save();
      }
    }

    console.log(`超期提醒检查完成，处理了${milestones.length}个节点`);
  } catch (error) {
    console.error('超期提醒检查失败:', error);
  }
}

function determineNotification(rule, daysUntil, milestone) {
  if (rule.milestone_name && rule.milestone_name !== milestone.name) {
    return false;
  }

  const warningDays = rule.warning_days || 0;

  if (daysUntil < 0) {
    return warningDays === 0;
  }

  return daysUntil <= warningDays;
}

async function sendReminderNotifications(milestone, rule, daysUntilDeadline) {
  const notifyMethods = Array.isArray(rule.notify_methods)
    ? rule.notify_methods
    : JSON.parse(rule.notify_methods || '["system"]');

  const notifyRoles = Array.isArray(rule.notify_roles)
    ? rule.notify_roles
    : JSON.parse(rule.notify_roles || '["lawyer"]');

  const extraUserIds = rule.extra_user_ids
    ? (Array.isArray(rule.extra_user_ids)
      ? rule.extra_user_ids
      : JSON.parse(rule.extra_user_ids || '[]'))
    : [];

  const caseData = milestone.case_info || await Case.findByPk(milestone.case_id);
  if (!caseData) return;

  const usersToNotify = new Set();

  if (milestone.assignee_id) usersToNotify.add(milestone.assignee_id);
  if (caseData.lead_lawyer_id) usersToNotify.add(caseData.lead_lawyer_id);

  const roleUsers = await User.findAll({
    where: { role: { [Op.in]: notifyRoles }, is_active: 1 },
    attributes: ['id']
  });
  roleUsers.forEach(u => usersToNotify.add(u.id));
  extraUserIds.forEach(id => usersToNotify.add(id));

  const isOverdue = daysUntilDeadline < 0;
  const type = isOverdue ? 'deadline_overdue' : 'deadline_warning';
  const title = isOverdue
    ? `【已超期】案件「${caseData.case_name}」节点「${milestone.name}」已超期${Math.abs(daysUntilDeadline)}天`
    : `【临期提醒】案件「${caseData.case_name}」节点「${milestone.name}」还有${daysUntilDeadline}天到期`;

  const content = `案件编号：${caseData.case_number}
案件名称：${caseData.case_name}
节点名称：${milestone.name}
${milestone.description ? `节点描述：${milestone.description}` : ''}
截止日期：${milestone.deadline_date}
${isOverdue ? `超期天数：${Math.abs(daysUntilDeadline)}天` : `剩余天数：${daysUntilDeadline}天`}
${milestone.assignee_id ? `负责人ID：${milestone.assignee_id}` : ''}`.trim();

  for (const userId of usersToNotify) {
    for (const method of notifyMethods) {
      await Notification.create({
        user_id: userId,
        type,
        title,
        content,
        related_type: 'milestone',
        related_id: milestone.id,
        send_method: method
      });

      if (method === 'email') {
        try {
          await sendEmailNotification(userId, title, content);
        } catch (emailErr) {
          console.warn(`邮件发送失败 (用户ID: ${userId}):`, emailErr.message);
        }
      }

      if (method === 'sms') {
        try {
          await sendSmsNotification(userId, title);
        } catch (smsErr) {
          console.warn(`短信发送失败 (用户ID: ${userId}):`, smsErr.message);
        }
      }
    }
  }
}

async function sendEmailNotification(userId, title, content) {
  const user = await User.findByPk(userId);
  if (!user || !user.email) return;

  const nodemailer = require('nodemailer');
  if (!process.env.SMTP_HOST) {
    console.log(`[模拟邮件] 发送至 ${user.email}: ${title}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: title,
    text: content
  });
}

async function sendSmsNotification(userId, content) {
  const user = await User.findByPk(userId);
  if (!user || !user.phone) return;

  console.log(`[模拟短信] 发送至 ${user.phone}: ${content.substring(0, 100)}`);
}

function startReminderScheduler() {
  const cronExpression = process.env.REMINDER_CRON || '0 8,12,18 * * *';
  console.log(`提醒任务调度已启动，Cron表达式：${cronExpression}`);
  return cron.schedule(cronExpression, checkDeadlinesAndNotify, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  });
}

module.exports = {
  checkDeadlinesAndNotify,
  startReminderScheduler,
  sendReminderNotifications
};
