import Machine from '../models/Machine.js';

export const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMachine = async (req, res) => {
  try {
    const machineData = { ...req.body };
    console.log("Received machine data:", JSON.stringify(machineData, null, 2));
    
    // Ensure nested objects exist to trigger Mongoose schema defaults
    if (!machineData.pricing) machineData.pricing = {};
    if (!machineData.specs) machineData.specs = {};
    if (!machineData.warranty) machineData.warranty = {};
    if (!machineData.attachments) machineData.attachments = [];
    if (!machineData.images) machineData.images = [];
    
    if (!machineData.machineId) {
      machineData.machineId = `LM-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    const newMachine = new Machine(machineData);
    await newMachine.save();
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMachine = async (req, res) => {
  try {
    const updateData = { ...req.body };
    console.log("Updating machine ID:", req.params.id);
    console.log("Update payload documents count:", updateData.documents?.length || 0);
    
    if (updateData.pricing === null) delete updateData.pricing;
    if (updateData.specs === null) delete updateData.specs;
    if (updateData.warranty === null) delete updateData.warranty;
    if (updateData.attachments === null) delete updateData.attachments;
    if (updateData.images === null) delete updateData.images;
    
    const updatedMachine = await Machine.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
