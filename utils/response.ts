const responseStatusCode = {
  success: 200,
  created: 201,
  badRequest: 400,
  unAuthorizedRequest: 401,
  notFound: 404,
  validationError: 422,
  tooManyRequest: 429,
  internalServerError: 500,
};

interface Data {
  message: string;
  data: unknown;
}

interface List {
  message?: string;
  total: number;
  limit: number;
  skip: number;
  data: unknown[];
}

const successCreate = (data: any, res) => {
  // Remove unwanted columns from the data object if they exist

  if ('updated_at' in data) delete data.updated_at;
  if ('created_at' in data) delete data.created_at;
  if ('deleted_at' in data) delete data.deleted_at;
  if ('created_at_ip' in data) delete data.created_at_ip;
  if ('updated_at_ip' in data) delete data.updated_at_ip;
  if ('deleted_at_ip' in data) delete data.deleted_at_ip;
  if ('password' in data) delete data.password;

  // Send the modified data object in the response
  res.status(responseStatusCode.created).json({
    status: 1,
    message: 'Record Created Successfully',
    data: data,
  });
};

const successResponse = (data: Data, res) =>
  res.status(responseStatusCode.success).json({
    status: 1,
    message: data.message
      ? data.message
      : 'Your request is successfully executed',
    data: data.data,
  });

const successResponseWithPagination = (data: List, res) => {
  const message = data.data.length ? 'Records found.' : 'No Record Found.';
  res.status(responseStatusCode.success).json({
    status: 1,
    message: data.message ? data.message : message,
    total: data.total,
    limit: data.limit,
    skip: data.skip,
    data: data.data,
  });
};

const failureResponse = (data: Data, res) =>
  res.status(responseStatusCode.internalServerError).json({
    status: 0,
    message: data.message ? data.message : 'Internal Server Error',
    data: data.data,
  });

const badRequest = (data: Data, res) =>
  res.status(responseStatusCode.badRequest).json({
    status: 0,
    message: data.message
      ? data.message
      : 'The request cannot be fulfilled due to bad syntax',
    data: data.data,
  });

const validationError = (data: Data, res) =>
  res.status(responseStatusCode.validationError).json({
    status: 0,
    message: data.message ? data.message : 'Invalid Data, Validation Failed',
    data: data.data,
  });

const isDuplicate = (data: Data, res) =>
  res.status(responseStatusCode.validationError).json({
    status: 0,
    message: data.message ? data.message : 'Data Duplication Found',
    data: data.data,
  });

const recordNotFound = (data: Data, res) =>
  res.status(responseStatusCode.success).json({
    status: 0,
    message: data.message
      ? data.message
      : 'Record not found with specified criteria.',
    data: data.data,
  });

const mongoError = (err, res) =>
  res.status(responseStatusCode.internalServerError).json({
    status: 0,
    message: 'Mongo db related error',
    data: err,
  });

const inValidParam = (err, res) =>
  res.status(responseStatusCode.validationError).json({
    status: 0,
    message: 'Invalid values in parameters',
    data: err,
  });

const unAuthorizedRequest = (res) =>
  res.status(responseStatusCode.unAuthorizedRequest).json({
    status: 0,
    message: 'You are not authorized to access the request',
  });

const failedSoftDelete = (res) =>
  res.status(responseStatusCode.internalServerError).json({
    status: 0,
    message: 'Data can not be deleted due to internal server error',
    data: {},
  });

const changePasswordFailure = (data, res) =>
  res.status(responseStatusCode.success).json({
    status: 0,
    message: `Password cannot be changed due to ${data}`,
    data: {},
  });

const changePasswordSuccess = (data, res) =>
  res.status(responseStatusCode.success).json({
    status: 1,
    message: data,
    data: {},
  });

const tooManyRequest = (res) =>
  res.status(responseStatusCode.tooManyRequest).json({
    status: 0,
    message: 'Too many requests, please try again later.',
  });

const response = {
  successCreate,
  successResponse,
  successResponseWithPagination,
  failureResponse,
  badRequest,
  validationError,
  isDuplicate,
  recordNotFound,
  mongoError,
  inValidParam,
  unAuthorizedRequest,
  failedSoftDelete,
  changePasswordFailure,
  changePasswordSuccess,
  tooManyRequest,
};
export default response;
