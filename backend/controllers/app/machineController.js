import prisma from '../../config/prisma.js';

export const getMachines = async (req, res) => {
  try {
    const { page, limit, search, category, paginated } = req.query;

    if (paginated === 'true' || page) {
      let filter = {};
      console.log(`[getMachines] Paginated Request: page=${page}, limit=${limit}, search=${search}`);
      
      let where = {};
      let AND = [];

      if (search && search !== 'undefined' && search !== 'null') {
        AND.push({
          OR: [
            { name: { contains: search } },
            { model: { contains: search } },
            { category: { contains: search } }
          ]
        });
      }

      if (category && category !== 'All Categories' && category !== 'undefined' && category !== 'null') {
        AND.push({ category: category });
      }

      if (AND.length > 0) {
        where = { AND };
      }

      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      
      const machines = await prisma.machines.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { id: 'desc' }
      });
      const total = await prisma.machines.count({ where });

      const mappedMachines = machines.map(m => ({ ...m, _id: m.id }));

      return res.json({
        machines: mappedMachines,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / limitNumber)
      });
    }

    const machines = await prisma.machines.findMany({
      select: {
        id: true,
        name: true,
        model: true,
        machineId: true,
        category: true,
        status: true,
        pricing: true,
        attachments: true,
        specs: true,
        warranty: true,
        images: true,
        img: true
      },
      orderBy: { id: 'desc' }
    });
    
    const mappedMachines = machines.map(m => ({ ...m, _id: m.id }));
    res.json(mappedMachines);
  } catch (error) {
    console.error('Prisma Error:', error);
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
    
    // Generate a new 24-char hex string for id (like MongoDB ObjectId)
    const newId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const newMachine = await prisma.machines.create({
      data: {
        id: newId,
        machineId: machineData.machineId,
        category: machineData.category || 'WHEEL LOADER',
        machineType: machineData.machineType || 'WHEELED',
        name: machineData.name || '',
        model: machineData.model || '',
        brand: machineData.brand || 'LiuGong',
        images: machineData.images,
        pricing: machineData.pricing,
        warranty: machineData.warranty,
        attachments: machineData.attachments,
        specs: machineData.specs,
        img: machineData.img || '',
        status: machineData.status || 'Available',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(201).json({ ...newMachine, _id: newMachine.id });
  } catch (error) {
    console.error('Prisma Create Error:', error);
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
    
    updateData.updatedAt = new Date();

    const updatedMachine = await prisma.machines.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json({ ...updatedMachine, _id: updatedMachine.id });
  } catch (error) {
    console.error('Prisma Update Error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const machine = await prisma.machines.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Machine not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { cat_name: 'asc' }
    });
    const mappedCategories = categories.map(c => ({ ...c, _id: c.id }));
    res.json(mappedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const syncCategories = async (req, res) => {
  try {
    const response = await fetch('https://lipl.sods.app/api/dmobile/getCategories');
    const data = await response.json();
    
    if (data.status && data.result) {
      const generateObjectId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

      const ops = data.result.map(cat => {
        return prisma.categories.upsert({
          where: { id: cat.cat_id.toString() }, // Assume we can use cat_id as unique or just ID
          update: { 
            cat_id: cat.cat_id,
            cat_name: cat.cat_name,
            rawData: cat,
            updatedAt: new Date()
          },
          create: {
            id: generateObjectId(),
            cat_id: cat.cat_id,
            cat_name: cat.cat_name,
            rawData: cat,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      });
      
      if (ops.length > 0) {
        // Find existing categories by cat_id to do proper upsert since ID is 24char hex
        for (const cat of data.result) {
           const existing = await prisma.categories.findFirst({ where: { cat_id: cat.cat_id } });
           if (existing) {
             await prisma.categories.update({
               where: { id: existing.id },
               data: {
                 cat_name: cat.cat_name,
                 rawData: cat,
                 updatedAt: new Date()
               }
             });
           } else {
             await prisma.categories.create({
               data: {
                 id: generateObjectId(),
                 cat_id: cat.cat_id,
                 cat_name: cat.cat_name,
                 rawData: cat,
                 createdAt: new Date(),
                 updatedAt: new Date()
               }
             });
           }
        }
      }
      res.json({ message: 'Categories synced successfully', count: data.result.length });
    } else {
      res.status(400).json({ message: 'Failed to fetch categories from external API' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const syncProducts = async (req, res) => {
  try {
    const response = await fetch('https://lipl.sods.app/api/dmobile/getProducts');
    const data = await response.json();

    if (data.status && data.result) {
      const generateObjectId = () => [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

      for (const prod of data.result) {
        const imageUrls = [];
        if (prod.ref_file) {
          imageUrls.push(`https://lipl.sods.app/${prod.ref_file}`);
        } else if (prod.prod_image) {
          imageUrls.push(`https://lipl.sods.app/${prod.prod_image}`);
        }

        const attachments = (prod.attachments || []).map(att => ({
          type: 'Attachment',
          config: att.attach_name,
          capacity: '',
          amount: 0,
          isStandard: true
        }));

        let stdMonths = 12, stdHours = 2000;
        if (prod.prod_std_warranty) {
          const match = prod.prod_std_warranty.match(/(\d+)M\s*\/\s*(\d+)/i);
          if (match) {
            stdMonths = parseInt(match[1]);
            stdHours = parseInt(match[2]);
          }
        }
        
        const machineId = `PROD-${prod.prod_id}`;

        const existing = await prisma.machines.findFirst({ where: { machineId } });
        
        const updatePayload = {
          name: prod.prod_name,
          model: prod.prod_model_type || 'Standard',
          category: prod.category?.cat_name || 'Wheeled',
          machineType: prod.prod_type || 'WHEELED',
          brand: 'LiuGong',
          isFromAPI: true,
          images: imageUrls,
          img: imageUrls[0] || '',
          pricing: {
            totalPrice: prod.prod_total_price || 0,
            oemNetSaleValue: prod.prod_nsv || 0,
            commissionA: prod.prod_sale_commision_slot_a || 0,
            commissionB: prod.prod_sale_commision_slot_b || 0,
            serviceCommission: prod.prod_service_commision || 0
          },
          specs: {
            horsePower: prod.prod_house_power || '',
            fuelType: prod.prod_fuel_used || 'Diesel',
            cylinders: String(prod.prod_cylinders || ''),
            year: String(prod.prod_yom || ''),
            unladenWeight: String(prod.prod_unladen_weight || ''),
            engineModel: prod.prod_specification || ''
          },
          warranty: {
            standardMonths: stdMonths,
            standardHours: stdHours
          },
          attachments: attachments,
          updatedAt: new Date()
        };

        if (existing) {
          await prisma.machines.update({
            where: { id: existing.id },
            data: updatePayload
          });
        } else {
          await prisma.machines.create({
            data: {
              id: generateObjectId(),
              machineId,
              ...updatePayload,
              status: 'Available',
              createdAt: new Date()
            }
          });
        }
      }

      res.json({ message: 'Products synced successfully', count: data.result.length });
    } else {
      res.status(400).json({ message: 'Failed to fetch products from external API' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

