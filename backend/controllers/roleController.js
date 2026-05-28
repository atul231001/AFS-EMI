import Role from '../models/Role.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });

    const { name, permissions } = req.body;
    if (name) role.name = name;
    
    if (permissions) {
      Object.keys(permissions).forEach(modKey => {
        // Ensure module object exists
        if (!role.permissions[modKey]) {
          role.permissions[modKey] = {};
        }
        
        // Update specific actions
        Object.keys(permissions[modKey]).forEach(action => {
          role.permissions[modKey][action] = permissions[modKey][action];
        });
      });
      
      // Force Mongoose to recognize the nested update
      role.markModified('permissions');
    }

    await role.save();
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
