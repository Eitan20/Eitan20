
/* For article creation */
const StatusCodes = {
  error: -1,
  new: 0, 
  started: 1,
  finished: 2
}

const subscriptionNameToId = {
  basic: 0,
  enterprise: 1,
  masterclass: 2
}


module.exports = {
  StatusCodes,
  subscriptionNameToId
}
