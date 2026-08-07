import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../backend/.env' });

const Machine = mongoose.model('Machine', new mongoose.Schema({
  machineId: String,
  name: String,
  model: String,
  category: String,
  machineType: String,
  brand: String,
  isFromAPI: Boolean,
  images: [String],
  img: String,
  pricing: Object,
  specs: Object,
  warranty: Object,
  attachments: Array
}, { strict: false }));

async function syncProducts() {
  try {
    console.log("Connecting to", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    
    const response = await fetch('https://lipl.sods.app/api/dmobile/getProducts');
    const data = await response.json();

    if (data.status && data.result) {
      const ops = data.result.map(prod => {
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

        return {
          updateOne: {
            filter: { machineId: `PROD-${prod.prod_id}` },
            update: {
              $set: {
                machineId: `PROD-${prod.prod_id}`,
                name: prod.prod_name,
                model: prod.prod_model_type || 'Standard',
                category: prod.category?.cat_name || 'Wheeled',
                machineType: prod.prod_type || 'WHEELED',
                brand: 'LiuGong',
                isFromAPI: true,
                images: imageUrls,
                img: imageUrls[0] || '',
                'pricing.totalPrice': prod.prod_total_price || 0,
                'pricing.oemNetSaleValue': prod.prod_nsv || 0,
                'pricing.commissionA': prod.prod_sale_commision_slot_a || 0,
                'pricing.commissionB': prod.prod_sale_commision_slot_b || 0,
                'pricing.serviceCommission': prod.prod_service_commision || 0,
                'specs.horsePower': prod.prod_house_power || '',
                'specs.fuelType': prod.prod_fuel_used || 'Diesel',
                'specs.cylinders': String(prod.prod_cylinders || ''),
                'specs.year': String(prod.prod_yom || ''),
                'specs.unladenWeight': String(prod.prod_unladen_weight || ''),
                'specs.engineModel': prod.prod_specification || '',
                'warranty.standardMonths': stdMonths,
                'warranty.standardHours': stdHours,
                attachments: attachments
              }
            },
            upsert: true
          }
        };
      });

      if (ops.length > 0) {
        console.log("Writing ops...");
        await Machine.bulkWrite(ops);
        console.log("Products synced successfully, count:", ops.length);
      }
    } else {
      console.log("Failed to fetch products from external API");
    }
  } catch (error) {
    console.error("Error during sync:", error);
  } finally {
    mongoose.disconnect();
  }
}

syncProducts();
