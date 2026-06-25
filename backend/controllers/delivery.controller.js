const DeliveryAgent = require('../models/DeliveryAgent');
const Route = require('../models/Route');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');

const getAgents = async (req, res) => {
  const { search, status, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
  const filter = { deleted_at: null };
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search } },
    { phone: { $regex: search } },
    { agent_id: { $regex: search } },
  ];
  const result = await paginate('delivery_agents', filter, { page, limit, sortBy, sortOrder });
  return ApiResponse.paginated(res, result.data, result.pagination);
};

const getAgent = async (req, res) => {
  const agent = await DeliveryAgent.findById(req.params.id);
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent);
};

const createAgent = async (req, res) => {
  const agent = await DeliveryAgent.create(req.body);
  return ApiResponse.created(res, agent, 'Delivery agent registered');
};

const updateAgent = async (req, res) => {
  const agent = await DeliveryAgent.update(req.params.id, req.body);
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent, 'Agent updated');
};

const deleteAgent = async (req, res) => {
  const agent = await DeliveryAgent.softDelete(req.params.id);
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, null, 'Agent deleted');
};

const updateAgentStatus = async (req, res) => {
  const { status } = req.body;
  const agent = await DeliveryAgent.update(req.params.id, { status });
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent, `Agent ${status}`);
};

const verifyAgent = async (req, res) => {
  const agent = await DeliveryAgent.update(req.params.id, { isVerified: true, verifiedBy: req.user._id });
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent, 'Agent verified');
};

const assignRoute = async (req, res) => {
  const { routeIds } = req.body;
  const agent = await DeliveryAgent.update(req.params.id, { assignedRoutes: routeIds });
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent, 'Routes assigned');
};

const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  const agent = await DeliveryAgent.update(req.params.id, {
    currentLocation: { lat, lng, updatedAt: new Date().toISOString() },
  });
  if (!agent) return ApiResponse.notFound(res, 'Agent not found');
  return ApiResponse.success(res, agent.current_location, 'Location updated');
};

// Routes management
const getRoutes = async (req, res) => {
  const routes = await Route.findAll();
  return ApiResponse.success(res, routes);
};

const createRoute = async (req, res) => {
  const route = await Route.create(req.body);
  return ApiResponse.created(res, route, 'Route created');
};

const updateRoute = async (req, res) => {
  const route = await Route.update(req.params.id, req.body);
  if (!route) return ApiResponse.notFound(res, 'Route not found');
  return ApiResponse.success(res, route, 'Route updated');
};

const deleteRoute = async (req, res) => {
  const route = await Route.softDelete(req.params.id);
  if (!route) return ApiResponse.notFound(res, 'Route not found');
  return ApiResponse.success(res, null, 'Route deleted');
};

module.exports = { getAgents, getAgent, createAgent, updateAgent, deleteAgent, updateAgentStatus, verifyAgent, assignRoute, updateLocation, getRoutes, createRoute, updateRoute, deleteRoute };
