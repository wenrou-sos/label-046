const { MilestoneTemplate } = require('../models');

async function generateMilestonesFromTemplate(caseId, caseType, filingDate, userId) {
  let templates = await MilestoneTemplate.findAll({
    where: {
      [require('sequelize').Op.or: [
        { case_type: caseType },
        { case_type: null }
      ]
    },
    order: [['sort_order', 'ASC']]
  });

  if (templates.length === 0) {
    templates = await MilestoneTemplate.findAll({
      where: { case_type: null },
      order: [['sort_order', 'ASC']]
    });
  }

  const { Milestone } = require('../models');
  const { addDays } = require('../utils/helpers');

  const baseDate = filingDate ? new Date(filingDate) : new Date();
  const milestones = [];

  for (const tmpl of templates) {
    const deadlineDate = addDays(baseDate, tmpl.default_deadline_days || 0);
    const reminderDate = addDays(deadlineDate, -3);

    const milestone = await Milestone.create({
      case_id: caseId,
      template_id: tmpl.id,
      name: tmpl.name,
      description: tmpl.description,
      status: 'pending',
      planned_date: deadlineDate.toISOString().split('T')[0],
      deadline_date: deadlineDate.toISOString().split('T')[0],
      reminder_date: reminderDate.toISOString().split('T')[0],
      is_auto_generated: 1,
      created_by: userId
    });
    milestones.push(milestone);
  }

  return milestones;
}

module.exports = { generateMilestonesFromTemplate };
