// const express = require('express');
// const router = express.Router();
// const { StatusCodes } = require('http-status-codes');
// const { user: userServiceClient } = require('../services/serviceRegistry');

// // Middleware xử lý lỗi
// const errorHandler = (error, res) => {
//     console.error('Service Error:', error);
//     const status = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
//     const message = error.response?.data?.message || 'Internal Server Error';

//     res.status(status).json({
//         success: false,
//         message,
//         error: error.message
//     });
// };

// router.post('/sign-in', async (req, res) => {
//     try {
//         const response = await userServiceClient.post('/api/user/sign-in', req.body);
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         errorHandler(error, res);
//     }
// });

// router.post('/sign-up', async (req, res) => {
//     try {
//         const response = await userServiceClient.post('/api/user/sign-up', req.body);
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         errorHandler(error, res);
//     }
// });

// router.post('/refresh-token', async (req, res) => {
//     try {
//         const token = req.headers.authorization;
//         if (!token) {
//             return res.status(401).json({
//                 message: 'Token is missing at API Gateway',
//                 status: 'ERROR',
//             });
//         }

//         const response = await userServiceClient.post('/api/user/refresh-token', req.body, {
//             headers: {
//                 'Authorization': token,
//                 'Content-Type': 'application/json'
//             }
//         });

//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error("Error when calling user service:", error.response?.data || error.message);
//         res.status(error.response?.status || 500).json({
//             message: error.response?.data?.message || 'Internal server error at API Gateway',
//             status: 'ERROR',
//         });
//     }
// });

// router.post('/log-out', async (req, res) => {
//     try {
//         const response = await userServiceClient.post('/api/user/log-out', req.body);
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         errorHandler(error, res);
//     }
// });

// router.get('/get-detail/:id', async (req, res) => {
//     try {
//         const response = await userServiceClient.get(`/api/user/get-detail/${req.params.id}`, req.body);
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         errorHandler(error, res);
//     }
// });

// // admin

// router.get('/admin/get-all', async (req, res) => {
//     try {
//         const authHeader = req.headers.authorization;
//         const token = authHeader && authHeader.split(' ')[1];

//         if (!token) {
//             return res.status(401).json({
//                 message: 'Token is missing at API Gateway',
//                 status: 'ERROR',
//             });
//         }

//         const response = await userServiceClient.get('/api/user/admin/get-all', {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error("Error when calling user service:", error.response?.data || error.message);
//         res.status(error.response?.status || 500).json({
//             message: error.response?.data?.message || 'Internal server error at API Gateway',
//             status: 'ERROR',
//         });
//     }
// });

// router.delete('/admin/delete-user/:id', async (req, res) => {
//     try {
//         const authHeader = req.headers.authorization;
//         const token = authHeader && authHeader.split(' ')[1];

//         if (!token) {
//             return res.status(401).json({
//                 message: 'Token is missing at API Gateway',
//                 status: 'ERROR',
//             });
//         }

//         const response = await userServiceClient.delete(`/api/user/admin/delete-user/${req.params.id}`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });

//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error("Error when calling user service:", error.response?.data || error.message);
//         res.status(error.response?.status || 500).json({
//             message: error.response?.data?.message || 'Internal server error at API Gateway',
//             status: 'ERROR',
//         });
//     }
// });

// router.put('/admin/update-user/:id', async (req, res) => {
//     try {
//         const authHeader = req.headers.authorization;
//         const token = authHeader && authHeader.split(' ')[1];

//         if (!token) {
//             return res.status(401).json({
//                 message: 'Token is missing at API Gateway',
//                 status: 'ERROR',
//             });
//         }

//         const response = await userServiceClient.put(
//             `/api/user/admin/update-user/${req.params.id}`,
//             req.body,
//             {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error("Error when calling user service:", error.response?.data || error.message);
//         res.status(error.response?.status || 500).json({
//             message: error.response?.data?.message || 'Internal server error at API Gateway',
//             status: 'ERROR',
//         });
//     }
// });

// module.exports = router;

// src/routes/userRouter.js
const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const ServiceClient = require('../services/serviceClient');
const userServiceClient = new ServiceClient('user_service');

const errorHandler = (error, res) => {
  console.error('Service Error:', error);
  const status = error.response?.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.response?.data?.message || 'Internal Server Error';
  res.status(status).json({
    success: false,
    message,
    error: error.message,
  });
};

router.post('/sign-in', async (req, res) => {
  try {
    const response = await userServiceClient.post('/api/user/sign-in', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/sign-up', async (req, res) => {
  try {
    const response = await userServiceClient.post('/api/user/sign-up', req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/get-detail/:id', async (req, res) => {
  try {
    const response = await userServiceClient.get(`/api/user/get-detail/${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/admin/get-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Original Authorization header:', authHeader);
    console.log('Extracted token:', token);

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway',
        status: 'ERROR',
      });
    }

    const response = await userServiceClient.getAuth('/api/user/admin/get-all', token);

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

router.delete('/admin/delete-user/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token is missing at API Gateway',
        status: 'ERROR',
      });
    }

    const response = await userServiceClient.delete(`/api/user/admin/delete-user/${req.params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error when calling user service:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Internal server error at API Gateway',
      status: 'ERROR',
    });
  }
});

module.exports = router;
