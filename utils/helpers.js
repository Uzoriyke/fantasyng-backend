const canAwardFreeBadge = (role) => ['ceo','coo','chief_moderator'].includes(role);
const getPlanDays = (plan) => ({ monthly: 30, '3months': 90, '6months': 180, annual: 365 }[plan] || 30);
module.exports = { canAwardFreeBadge, getPlanDays };
