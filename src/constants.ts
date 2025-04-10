export const EMAIL_REG = /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/g;

export const ALLOWED_SORT_FIELDS = ['createtime', 'updatetime'];

export const REWARD_CONSTANT = {
  NOT_FOUND: '该奖励不存在',
  NO_ENABLE_NUM: '该奖励可兑换数量不足',
  NO_EXCHANGE_USER: '兑换人不存在',
  NO_EXCHANGE_MONEY: '积分不足',
  NOT_FOUND_EXCHANGE: '该兑换不存在',
  OVER_DATE: '不在兑换日期内',
};

export const TASK_CONSTANT = {
  NOT_FOUND: '该任务不存在',
  NO_TASK_MY: '无权修改他人任务',
  EXIST_SUB_TASK_NO_COMPLETE: '请先完成子任务',
  NO_COMPLETE_USER: '提交人不存在',
};

export const SUB_TASK_CONSTANT = {
  NOT_FOUND: '子任务不存在',
};

export const USER_CONSTANT = {
  NOT_FOUND: '用户不存在',
  UID_ERROR: '绑定码错误',
  NO_BINGDING_MY: '不能绑定自己',
  EXIST_PARTNER: '绑定用户已有伴侣',
  EXIST_PARTNER2: '你已有伴侣',
};
