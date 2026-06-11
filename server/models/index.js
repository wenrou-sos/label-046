const User = require('./User');
const Case = require('./Case');
const Party = require('./Party');
const CaseParty = require('./CaseParty');
const Document = require('./Document');
const DocumentCategory = require('./DocumentCategory');
const Milestone = require('./Milestone');
const MilestoneTemplate = require('./MilestoneTemplate');
const Notification = require('./Notification');
const ReminderRule = require('./ReminderRule');

Case.belongsTo(User, { as: 'lead_lawyer', foreignKey: 'lead_lawyer_id' });
Case.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Case.hasMany(CaseParty, { as: 'case_parties', foreignKey: 'case_id' });
Case.hasMany(Document, { as: 'documents', foreignKey: 'case_id' });
Case.hasMany(Milestone, { as: 'milestones', foreignKey: 'case_id' });

Party.hasMany(CaseParty, { as: 'case_associations', foreignKey: 'party_id' });

CaseParty.belongsTo(Case, { as: 'case_info', foreignKey: 'case_id' });
CaseParty.belongsTo(Party, { as: 'party_info', foreignKey: 'party_id' });

Document.belongsTo(Case, { as: 'case_info', foreignKey: 'case_id' });
Document.belongsTo(DocumentCategory, { as: 'category', foreignKey: 'category_id' });
Document.belongsTo(User, { as: 'uploader', foreignKey: 'uploaded_by' });

DocumentCategory.hasMany(Document, { as: 'documents', foreignKey: 'category_id' });

Milestone.belongsTo(Case, { as: 'case_info', foreignKey: 'case_id' });
Milestone.belongsTo(MilestoneTemplate, { as: 'template', foreignKey: 'template_id' });
Milestone.belongsTo(User, { as: 'assignee', foreignKey: 'assignee_id' });

Notification.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = {
  User,
  Case,
  Party,
  CaseParty,
  Document,
  DocumentCategory,
  Milestone,
  MilestoneTemplate,
  Notification,
  ReminderRule
};
