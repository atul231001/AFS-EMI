import prisma from '../config/prisma.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await prisma.roles.findMany();
    // Map id to _id for frontend compatibility
    const mapped = roles.map(r => ({ ...r, _id: r.id }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRole = async (req, res) => {
  try {
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const payload = { ...req.body, id: newId, createdAt: new Date(), updatedAt: new Date() };
    const role = await prisma.roles.create({ data: payload });
    res.status(201).json({ ...role, _id: role.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const existing = await prisma.roles.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Role not found' });

    const { name, permissions } = req.body;
    const updateData = { updatedAt: new Date() };
    
    if (name) updateData.name = name;
    
    if (permissions) {
      let existingPermissions = {};
      try {
        if (typeof existing.permissions === 'string') {
          existingPermissions = JSON.parse(existing.permissions);
        } else if (existing.permissions) {
          existingPermissions = existing.permissions;
        }
      } catch (e) {}

      Object.keys(permissions).forEach(modKey => {
        if (!existingPermissions[modKey]) {
          existingPermissions[modKey] = {};
        }
        Object.keys(permissions[modKey]).forEach(action => {
          existingPermissions[modKey][action] = permissions[modKey][action];
        });
      });
      
      updateData.permissions = existingPermissions;
    }

    const updatedRole = await prisma.roles.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json({ ...updatedRole, _id: updatedRole.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    await prisma.roles.delete({ where: { id: req.params.id } });
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
