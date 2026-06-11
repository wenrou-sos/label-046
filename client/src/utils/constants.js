export const CASE_TYPE_OPTIONS = [
  { value: 'civil', label: '民事案件', color: 'blue' },
  { value: 'criminal', label: '刑事案件', color: 'red' },
  { value: 'administrative', label: '行政案件', color: 'orange' },
  { value: 'commercial', label: '商事案件', color: 'purple' },
  { value: 'labor', label: '劳动争议', color: 'green' },
  { value: 'family', label: '婚姻家庭', color: 'pink' },
  { value: 'other', label: '其他', color: 'default' }
];

export const CASE_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'pending', label: '待受理', color: 'warning' },
  { value: 'accepted', label: '已受理', color: 'processing' },
  { value: 'hearing', label: '审理中', color: 'processing' },
  { value: 'judgment', label: '已判决', color: 'success' },
  { value: 'appeal', label: '上诉中', color: 'warning' },
  { value: 'closed', label: '已结案', color: 'default' },
  { value: 'suspended', label: '已中止', color: 'error' }
];

export const PARTY_ROLE_OPTIONS = [
  { value: 'plaintiff', label: '原告' },
  { value: 'defendant', label: '被告' },
  { value: 'third_party', label: '第三人' },
  { value: 'appellant', label: '上诉人' },
  { value: 'appellee', label: '被上诉人' },
  { value: 'witness', label: '证人' }
];

export const PARTY_TYPE_OPTIONS = [
  { value: 'individual', label: '自然人' },
  { value: 'company', label: '企业法人' },
  { value: 'organization', label: '其他组织' }
];

export const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' }
];

export const MILESTONE_STATUS_OPTIONS = [
  { value: 'pending', label: '待开始', color: 'default' },
  { value: 'in_progress', label: '进行中', color: 'processing' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'delayed', label: '已超期', color: 'error' },
  { value: 'cancelled', label: '已取消', color: 'warning' }
];

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'deadline_warning', label: '临期提醒', color: 'warning' },
  { value: 'deadline_overdue', label: '超期通知', color: 'error' },
  { value: 'system', label: '系统通知', color: 'info' },
  { value: 'milestone', label: '节点通知', color: 'blue' },
  { value: 'case_update', label: '案件更新', color: 'success' }
];

export const FEE_STATUS_OPTIONS = [
  { value: 'unpaid', label: '未缴费', color: 'error' },
  { value: 'partial', label: '部分缴费', color: 'warning' },
  { value: 'paid', label: '已缴费', color: 'success' }
];

export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: '管理员', color: 'purple' },
  { value: 'lawyer', label: '律师', color: 'blue' },
  { value: 'assistant', label: '助理', color: 'green' }
];

export const REMINDER_PRIORITY_OPTIONS = [
  { value: 'low', label: '低', color: 'default' },
  { value: 'medium', label: '中', color: 'blue' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'urgent', label: '紧急', color: 'red' }
];

export function getOptionLabel(options, value) {
  const found = options.find(o => o.value === value);
  return found ? found.label : value;
}

export function getOptionColor(options, value) {
  const found = options.find(o => o.value === value);
  return found?.color || 'default';
}
