const ApiResponse = require('../utils/apiResponse');

/**
 * Role-Based Access Control middleware
 * Usage: authorize('superAdmin', 'operationsManager')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    next();
  };
};

/**
 * Permission-based middleware
 * Usage: hasPermission('orders.delete')
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    const rolePermissions = {
      superAdmin: ['*'],
      operationsManager: [
        'orders.*', 'delivery.*', 'shifts.*', 'vendors.*',
        'products.*', 'customers.read', 'customers.update',
      ],
      financeManager: [
        'payments.*', 'subscriptions.*', 'analytics.*', 'reports.*',
      ],
      deliveryManager: [
        'delivery.*', 'shifts.*', 'orders.read', 'orders.update',
      ],
      customerSupport: [
        'customers.*', 'orders.read', 'feedback.*', 'notifications.read',
      ],
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    const hasAccess =
      userPermissions.includes('*') ||
      userPermissions.includes(permission) ||
      userPermissions.some((p) => {
        if (p.endsWith('.*')) {
          const prefix = p.slice(0, -2);
          return permission.startsWith(prefix);
        }
        return false;
      });

    if (!hasAccess) {
      return ApiResponse.forbidden(res, `Insufficient permissions: ${permission}`);
    }
    next();
  };
};

module.exports = { authorize, hasPermission };
