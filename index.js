const express = require('express');
const {upload} = require("./utilities/multer");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const pagination = require('./utilities/pagination');
const app = express();
const port = process.env.PORT || 5000;
const limit =5;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());
app.use(express.static('static')); 
app.use('/images', express.static('images'))


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gt8bmu9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    
    const userCollection = client.db('captainPenProduct').collection("users");
    const divisionCollection = client.db('captainPenProduct').collection('divisions');
    const districtCollection = client.db('captainPenProduct').collection('districts');
    const subDistrictCollection = client.db('captainPenProduct').collection('subdistricts');
    const thanaCollection = client.db('captainPenProduct').collection('dhakaThana');
    const primaryItemCollection = client.db('captainPenProduct').collection('primaryItem');
    const layersCollection = client.db('captainPenProduct').collection('itemWithLayers');
    const productsCollection = client.db('captainPenProduct').collection('products');
    const coreProductsCollection = client.db('captainPenProduct').collection('coreProducts');
    const distributedProductsCollection = client.db('captainPenProduct').collection('distributedProducts');
    const distributeToSrCollection = client.db('captainPenProduct').collection('distributedProductsToSr');
    const distributionToShopCollection = client.db('captainPenProduct').collection('distributionToShop');
    const regionsCollection = client.db('captainPenProduct').collection('regions');
    const shopsCollection = client.db('captainPenProduct').collection('shops'); 
    const transactionCollection = client.db('captainPenProduct').collection('transaction'); 
    const dueTrackingCollection = client.db('captainPenProduct').collection('DueTracking'); 
    const dueRecoveryCollection = client.db('captainPenProduct').collection('dueRecovery'); 
    const productIndex = await productsCollection.createIndex({ "product_name":1 }, { unique: true });
    const userIndex = await userCollection.createIndex({"username":1},{ unique: true });
    const productCodeIndex = await productsCollection.createIndex({"product_code":1},{ unique: true });
    const regionNameIndex = await regionsCollection.createIndex({"region_name":1},{unique:true});
    try{

        //get all users

        app.get('/users',async(req,res)=>{
            let query = {};
            if(req.query){
                query=req.query;
            }
            // query.select('-password');
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })
        app.get('/paginated-users',async(req,res)=>{
          let page= req.query.page || 1;
          let countDoc, userData,paginateData ;
          if(req.query.role){
            countDoc=await userCollection.countDocuments({role:req.query.role});            
            paginateData  = pagination(countDoc,page)            
            userData =await userCollection.find({role:req.query.role}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
          }else{
            countDoc=await userCollection.countDocuments({});
            paginateData  = pagination(countDoc,page)            
            userData =await userCollection.find({}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
          }
          console.log(paginateData);
          const user = {
           userData,paginateData
          }
          res.send(user);
      })
      app.get('/admin-shops/:id',async(req,res)=>{
        const adminId = req.params.id;
        const page = req.query.page || 1;
        const adminShopCount = await shopsCollection.aggregate([
          { "$addFields": { "srId": { "$toObjectId": "$managed_by" }}},
          { "$lookup": {
            "from": "users",
            "localField": "srId",
            "foreignField": "_id",
            "as": "userDetails"
          }},
          {
              $unwind: {
                path: "$userDetails",
              }
            },
            { "$addFields": { "srId": { "$toObjectId": "$userDetails.managed_by" }}},
            { "$lookup": {
              "from": "users",
              "localField": "srId",
              "foreignField": "_id",
              "as": "userDetailsAsm"
            }},
            {
              $unwind: {
                path: "$userDetailsAsm",
              }
            },
            { "$addFields": { "asmId": { "$toObjectId": "$userDetailsAsm.managed_by" }}},
            { "$lookup": {
              "from": "users",
              "localField": "asmId",
              "foreignField": "_id",
              "as": "userDetailsAdmin"
            }},
            {
              $unwind: {
                path: "$userDetailsAdmin",
              }
            },
            { $match: { "userDetailsAdmin._id": new ObjectId(adminId)} },
            {
              $count: "shopCount"
            },
            {
              "$project": {
                "shopCount":1,
                "_id": 1,
                "shop_name":1,
                "owner_name":1,                
                "address":1,                
                "created_at":1,                
                "contact_no":1,
                "district_id":1,
                "division":1,
                "managed_by":1,                
                "region_id":1,                
                "subdistrict":1,                
                "thana":1,                
                "userDetails._id":1,
                "userDetails.name":1,
                "userDetails.managed_by":1,
                "userDetailsAsm._id":1,
                "userDetailsAsm.name":1,
                "userDetailsAsm.managed_by":1,
                "userDetailsAdmin._id":1,
                "userDetailsAdmin.name":1,
                
              }
            }
            
        ]).toArray();
        const countShop= adminShopCount[0].shopCount;
        let paginateData = pagination(countShop,page);
        const result = await  shopsCollection.aggregate([
          { "$addFields": { "srId": { "$toObjectId": "$managed_by" }}},
          { "$lookup": {
            "from": "users",
            "localField": "srId",
            "foreignField": "_id",
            "as": "userDetails"
          }},
          {
              $unwind: {
                path: "$userDetails",
              }
            },
            { "$addFields": { "srId": { "$toObjectId": "$userDetails.managed_by" }}},
            { "$lookup": {
              "from": "users",
              "localField": "srId",
              "foreignField": "_id",
              "as": "userDetailsAsm"
            }},
            {
              $unwind: {
                path: "$userDetailsAsm",
              }
            },
            { "$addFields": { "asmId": { "$toObjectId": "$userDetailsAsm.managed_by" }}},
            { "$lookup": {
              "from": "users",
              "localField": "asmId",
              "foreignField": "_id",
              "as": "userDetailsAdmin"
            }},
            {
              $unwind: {
                path: "$userDetailsAdmin",
              }
            },
            { $match: { "userDetailsAdmin._id": new ObjectId(adminId)} },
            {
              "$project": {
                "_id": 1,
                "shop_name":1,
                "owner_name":1,                
                "address":1,                
                "created_at":1,                
                "contact_no":1,
                "district_id":1,
                "division":1,
                "managed_by":1,                
                "region_id":1,                
                "subdistrict":1,                
                "thana":1,                
                "userDetails._id":1,
                "userDetails.name":1,
                "userDetails.managed_by":1,
                "userDetailsAsm._id":1,
                "userDetailsAsm.name":1,
                "userDetailsAsm.managed_by":1,
                "userDetailsAdmin._id":1,
                "userDetailsAdmin.name":1,
                
              }
            },
            { '$facet'    : {
              data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
          } }
      
        ]).toArray();
        const data = result[0].data;
        const finaldata = {data,paginateData }
        res.send(finaldata);
      })
        app.get('/sales',async(req,res)=>{
            let page =req.query.page || 1 ;
            const skipAmount = (page-1)*limit;
            let salesCollection =await  distributionToShopCollection.aggregate([
                { "$addFields": { "srId": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "shopId": { "$toObjectId": "$reciever_id" }}},  
                { "$lookup": {
                  "from": "users",
                  "localField": "srId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                    $unwind: {
                      path: "$userDetails",
                    }
                  },
                { "$lookup": {
                  "from": "shops",
                  "localField": "shopId",
                  "foreignField": "_id",
                  "as": "shopDetails"
                }},
                {
                    $unwind: {
                      path: "$shopDetails",
                    }
                  },
                { "$lookup": {
                    "from": "transaction",
                    "localField": "transaction_id",
                    "foreignField": "transaction_id",
                    "as": "transactionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$transactionDetails",
                      }
                    },
                  
                { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$addFields": { "regionId": { "$toObjectId": "$userDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "userDetails.zone"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails.zone",
                    }
                  },
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails.asm",
                    }
                  },
                  { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                  { "$lookup": {
                    "from": "users",
                    "localField": "adminId",
                    "foreignField": "_id",
                    "as": "userDetails.asm.admin"
                  }},
                  
                  {
                    $unwind: {
                      path: "$userDetails.asm.admin",
                    }
                  },
                  { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                    $unwind: {
                      path: "$productDetails",
                    }
                  },
                {
                    "$project": {
                      "_id": 1,
                      "product_name":1,
                      "distributed_amount":1,
                      "recieved_date":1,
                      "distributed_amount":1,
                      "price_per_unit":1,
                      "userDetails._id":1,
                      "userDetails.name":1,
                      "userDetails.region_id":1,
                      "userDetails.managed_by":1,
                      "userDetails.zone.region_name":1, 
                      "userDetails.zone._id":1, 
                      "userDetails.asm.name":1,
                      "userDetails.asm.managed_by":1,
                      "userDetails.asm.admin.name":1,
                      "shopDetails._id":1,
                      "shopDetails.shop_name":1,
                      "shopDetails.address":1,
                      "transactionDetails.transaction_id":1,
                      "transactionDetails.bill_img":1,
                      "transactionDetails.discount":1,
                      "transactionDetails.due":1, 
                      "transactionDetails.total_bill":1, 
                      "productDetails.unit_price":1,
                      "productDetails.category":1,
                      "productDetails.secondary_category":1,
                    }
                  },
                  { $group: { _id: null, count: { $sum: 1 } } }
            
              ]).toArray();
              
              const count = salesCollection.length;
              let paginateData = pagination(salesCollection[0].count, page);
              //  salesCollection = salesCollection.skip(paginateData.skippedIndex).limit(paginateData.perPage)
              const result = await  distributionToShopCollection.aggregate([
                { "$addFields": { "srId": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "shopId": { "$toObjectId": "$reciever_id" }}},  
                { "$lookup": {
                  "from": "users",
                  "localField": "srId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                    $unwind: {
                      path: "$userDetails",
                    }
                  },
                { "$lookup": {
                  "from": "shops",
                  "localField": "shopId",
                  "foreignField": "_id",
                  "as": "shopDetails"
                }},
                {
                    $unwind: {
                      path: "$shopDetails",
                    }
                  },
                { "$lookup": {
                    "from": "transaction",
                    "localField": "transaction_id",
                    "foreignField": "transaction_id",
                    "as": "transactionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$transactionDetails",
                      }
                    },
                  
                { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$addFields": { "regionId": { "$toObjectId": "$userDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "userDetails.zone"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails.zone",
                    }
                  },
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails.asm",
                    }
                  },
                  { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                  { "$lookup": {
                    "from": "users",
                    "localField": "adminId",
                    "foreignField": "_id",
                    "as": "userDetails.asm.admin"
                  }},
                  
                  {
                    $unwind: {
                      path: "$userDetails.asm.admin",
                    }
                  },
                  { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                    $unwind: {
                      path: "$productDetails",
                    }
                  },
                {
                    "$project": {
                      "_id": 1,
                      "product_name":1,
                      "distributed_amount":1,
                      "recieved_date":1,
                      "distributed_amount":1,
                      "price_per_unit":1,
                      "userDetails._id":1,
                      "userDetails.name":1,
                      "userDetails.region_id":1,
                      "userDetails.managed_by":1,
                      "userDetails.zone.region_name":1, 
                      "userDetails.zone._id":1, 
                      "userDetails.asm.name":1,
                      "userDetails.asm.managed_by":1,
                      "userDetails.asm.admin.name":1,
                      "shopDetails._id":1,
                      "shopDetails.shop_name":1,
                      "shopDetails.address":1,
                      "transactionDetails.transaction_id":1,
                      "transactionDetails.bill_img":1,
                      "transactionDetails.discount":1,
                      "transactionDetails.due":1, 
                      "transactionDetails.total_bill":1, 
                      "productDetails.unit_price":1,
                      "productDetails.category":1,
                      "productDetails.secondary_category":1,
                    }
                  },
                  { '$facet'    : {
                    data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                } }
            
              ]).toArray();
              const data = result[0].data;
              const finalResult  = {data ,paginateData}
             res.send(finalResult);
        })
        app.get('/filtered-sales',async(req,res)=>{
          let query ={};
          let salesCollection =await  distributionToShopCollection.aggregate([
              { "$addFields": { "srId": { "$toObjectId": "$sender_id" }}},
              { "$addFields": { "shopId": { "$toObjectId": "$reciever_id" }}},  
              { "$lookup": {
                "from": "users",
                "localField": "srId",
                "foreignField": "_id",
                "as": "userDetails"
              }},
              {
                  $unwind: {
                    path: "$userDetails",
                  }
                },
              { "$lookup": {
                "from": "shops",
                "localField": "shopId",
                "foreignField": "_id",
                "as": "shopDetails"
              }},
              {
                  $unwind: {
                    path: "$shopDetails",
                  }
                },
              { "$lookup": {
                  "from": "transaction",
                  "localField": "transaction_id",
                  "foreignField": "transaction_id",
                  "as": "transactionDetails"
                }},
                {
                    $unwind: {
                      path: "$transactionDetails",
                    }
                  },
                
              { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
              { "$addFields": { "regionId": { "$toObjectId": "$userDetails.region_id" }}},
              { "$lookup": {
                  "from": "regions",
                  "localField": "regionId",
                  "foreignField": "_id",
                  "as": "userDetails.zone"
                }},
                {
                  $unwind: {
                    path: "$userDetails.zone",
                  }
                },
              { "$lookup": {
                  "from": "users",
                  "localField": "asmId",
                  "foreignField": "_id",
                  "as": "userDetails.asm"
                }},
                {
                  $unwind: {
                    path: "$userDetails.asm",
                  }
                },
                { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                { "$lookup": {
                  "from": "users",
                  "localField": "adminId",
                  "foreignField": "_id",
                  "as": "userDetails.asm.admin"
                }},
                
                {
                  $unwind: {
                    path: "$userDetails.asm.admin",
                  }
                },
                { "$lookup": {
                  "from": "products",
                  "localField": "product_name",
                  "foreignField": "product_name",
                  "as": "productDetails"
                }},
                {
                  $unwind: {
                    path: "$productDetails",
                  }
                },
              {
                  "$project": {
                    "_id": 1,
                    "product_name":1,
                    "distributed_amount":1,
                    "recieved_date":1,
                    "distributed_amount":1,
                    "price_per_unit":1,
                    "userDetails._id":1,
                    "userDetails.name":1,
                    "userDetails.region_id":1,
                    "userDetails.managed_by":1,
                    "userDetails.zone.region_name":1, 
                    "userDetails.zone._id":1, 
                    "userDetails.asm.name":1,
                    "userDetails.asm.managed_by":1,
                    "userDetails.asm.admin.name":1,
                    "shopDetails._id":1,
                    "shopDetails.shop_name":1,
                    "shopDetails.address":1,
                    "transactionDetails.transaction_id":1,
                    "transactionDetails.bill_img":1,
                    "transactionDetails.discount":1,
                    "transactionDetails.due":1, 
                    "transactionDetails.total_bill":1, 
                    "productDetails.unit_price":1,
                    "productDetails.category":1,
                    "productDetails.secondary_category":1,
                  }
                }
          
            ]).toArray();
            if(req.query.shopName || req.query.adminName || req.query.asmName || req.query.zoneName ||req.query.srName || req.query.zoneName){
              if(req.query.startDate===req.query.endDate){
                  
                  salesCollection= salesCollection.filter(sc=>
                      (sc.shopDetails.shop_name===(req.query.shopName==="null"?sc.shopDetails.shop_name : req.query.shopName )) &&
                      (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                      (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                      (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                      (sc.userDetails.zone.region_name === (req.query.zoneName==="null"? sc.userDetails.zone.region_name : req.query.zoneName )) &&
                       ((sc.recieved_date).split("T")[0]===(req.query.startDate==="null"? (sc.recieved_date).split("T")[0] : req.query.startDate))
                    )
              }else{
                  salesCollection= salesCollection.filter(sc=>
                      (sc.shopDetails.shop_name===(req.query.shopName==="null"?sc.shopDetails.shop_name : req.query.shopName )) &&
                      (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                      (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                      (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                      (sc.userDetails.zone.region_name === (req.query.zoneName==="null"? sc.userDetails.zone.region_name : req.query.zoneName )) &&
                      ((sc.recieved_date).split("T")[0] >=(req.query.startDate==="null"?(sc.recieved_date).split("T")[0]: (req.query.startDate))) &&
                      ((sc.recieved_date).split("T")[0]<=(req.query.endDate==="null"?(sc.recieved_date).split("T")[0] : (req.query.endDate))) 
                    )
              }
            }
            
           res.send(salesCollection);
      })
        // shop reports
        app.get('/shop-report',async(req,res)=>{
            let page =req.query.page || 1;
            let shops = await shopsCollection.aggregate([
                { "$addFields": { "regionId": { "$toObjectId": "$region_id" }}},
                { "$addFields": { "srId": { "$toObjectId": "$managed_by" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$regionDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "srId",
                    "foreignField": "_id",
                    "as": "userDetails"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails",
                      }
                    },                    
                { "$addFields": { "shopId": { "$toString": "$_id" }}},
                { "$lookup": {
                    "from": "dueRecovery",
                    "localField": "shopId",
                    "foreignField": "shop_id",
                    "as": "dueRecoveryDetails"
                  }},
                  
                { "$lookup": {
                    "from": "DueTracking",
                    "localField": "shopId",
                    "foreignField": "shop_id",
                    "as": "dueTrackingDetails"
                  }},
                  
                { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails.asm",
                      }
                    },
                    { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                    { "$lookup": {
                        "from": "users",
                        "localField": "adminId",
                        "foreignField": "_id",
                        "as": "userDetails.asm.admin"
                      }},
                      {
                          $unwind: {
                            path: "$userDetails.asm.admin",
                          }
                        },
                        {
                          $count:"shopCount"
                        },
                        {
                            "$project": {
                              "shopCount":1,
                              "_id": 1,
                              "shop_name":1,
                              "address":1,
                              "created_at":1,
                              "userDetails._id":1,
                              "userDetails.name":1,
                              "userDetails.managed_by":1,
                              "regionDetails.region_name":1,
                              "userDetails.asm.name":1,
                              "userDetails.asm.managed_by":1,
                              "userDetails.asm.admin.name":1,
                              "dueTrackingDetails.due":1,
                              "dueRecoveryDetails.paying_amount":1,
                              "dueRecoveryDetails.issue_date":1
                            }
                          }

            ]).toArray();
            const totShops = shops[0].shopCount;
            console.log(totShops);
            const paginateData = pagination(totShops,page)
            console.log(paginateData);
            let shopData = await shopsCollection.aggregate([
              { "$addFields": { "regionId": { "$toObjectId": "$region_id" }}},
              { "$addFields": { "srId": { "$toObjectId": "$managed_by" }}},
              { "$lookup": {
                  "from": "regions",
                  "localField": "regionId",
                  "foreignField": "_id",
                  "as": "regionDetails"
                }},
                {
                    $unwind: {
                      path: "$regionDetails",
                    }
                  },
              { "$lookup": {
                  "from": "users",
                  "localField": "srId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                    $unwind: {
                      path: "$userDetails",
                    }
                  },                    
              { "$addFields": { "shopId": { "$toString": "$_id" }}},
              { "$lookup": {
                  "from": "dueRecovery",
                  "localField": "shopId",
                  "foreignField": "shop_id",
                  "as": "dueRecoveryDetails"
                }},
                
              { "$lookup": {
                  "from": "DueTracking",
                  "localField": "shopId",
                  "foreignField": "shop_id",
                  "as": "dueTrackingDetails"
                }},
                
              { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
              { "$lookup": {
                  "from": "users",
                  "localField": "asmId",
                  "foreignField": "_id",
                  "as": "userDetails.asm"
                }},
                {
                    $unwind: {
                      path: "$userDetails.asm",
                    }
                  },
                  { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                  { "$lookup": {
                      "from": "users",
                      "localField": "adminId",
                      "foreignField": "_id",
                      "as": "userDetails.asm.admin"
                    }},
                    {
                        $unwind: {
                          path: "$userDetails.asm.admin",
                        }
                      },                      
                      {
                          "$project": {
                            "shopCount":1,
                            "_id": 1,
                            "shop_name":1,
                            "address":1,
                            "created_at":1,
                            "userDetails._id":1,
                            "userDetails.name":1,
                            "userDetails.managed_by":1,
                            "regionDetails.region_name":1,
                            "userDetails.asm.name":1,
                            "userDetails.asm.managed_by":1,
                            "userDetails.asm.admin.name":1,
                            "dueTrackingDetails.due":1,
                            "dueRecoveryDetails.paying_amount":1,
                            "dueRecoveryDetails.issue_date":1
                          }
                        },
                  { '$facet'    : {
                    data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                } }

          ]).toArray();
          const data = shopData[0].data;
          const result = {data,paginateData}
            res.send(result);
        })
        //  filtered shop reports
        app.get('/filtered-shop-report',async(req,res)=>{
            let query = {};
            let shopReport = await shopsCollection.aggregate([
                { "$addFields": { "regionId": { "$toObjectId": "$region_id" }}},
                { "$addFields": { "srId": { "$toObjectId": "$managed_by" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$regionDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "srId",
                    "foreignField": "_id",
                    "as": "userDetails"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails",
                      }
                    },                    
                { "$addFields": { "shopId": { "$toString": "$_id" }}},
                { "$lookup": {
                    "from": "dueRecovery",
                    "localField": "shopId",
                    "foreignField": "shop_id",
                    "as": "dueRecoveryDetails"
                  }},
                  
                { "$lookup": {
                    "from": "DueTracking",
                    "localField": "shopId",
                    "foreignField": "shop_id",
                    "as": "dueTrackingDetails"
                  }},
                  
                { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails.asm",
                      }
                    },
                    { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                    { "$lookup": {
                        "from": "users",
                        "localField": "adminId",
                        "foreignField": "_id",
                        "as": "userDetails.asm.admin"
                      }},
                      {
                          $unwind: {
                            path: "$userDetails.asm.admin",
                          }
                        },
                        {
                            "$project": {
                              "_id": 1,
                              "shop_name":1,
                              "address":1,
                              "created_at":1,
                              "userDetails._id":1,
                              "userDetails.name":1,
                              "userDetails.managed_by":1,
                              "regionDetails.region_name":1,
                              "userDetails.asm.name":1,
                              "userDetails.asm.managed_by":1,
                              "userDetails.asm.admin.name":1,
                              "dueTrackingDetails.due":1,
                              "dueRecoveryDetails.paying_amount":1,
                              "dueRecoveryDetails.issue_date":1
                            }
                          }

            ]).toArray();
            if(req.query.shopName || req.query.adminName || req.query.asmName || req.query.zoneName ||req.query.srName || req.query.zoneName){
                if(req.query.startDate===req.query.endDate){
                    shopReport= shopReport.filter(sc=>
                        (sc.shop_name===(req.query.shopName==="null"?sc.shop_name : req.query.shopName )) &&
                        (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                        (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                        (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                        (sc.regionDetails.region_name === (req.query.zoneName==="null"? sc.regionDetails.region_name : req.query.zoneName )) &&
                        ((sc.created_at).split("T")[0]===(req.query.startDate==="null"? (sc.created_at).split("T")[0] : req.query.startDate))
                      )
                  }else{
                    shopReport= shopReport.filter(sc=>
                        (sc.shop_name===(req.query.shopName==="null"?sc.shop_name : req.query.shopName )) &&
                        (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                        (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                        (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                        (sc.regionDetails.region_name === (req.query.zoneName==="null"? sc.regionDetails.region_name : req.query.zoneName )) &&
                        ((sc.created_at).split("T")[0] >=(req.query.startDate==="null"?(sc.created_at).split("T")[0]: (req.query.startDate))) &&
                        ((sc.created_at).split("T")[0]<=(req.query.endDate==="null"?(sc.created_at).split("T")[0] : (req.query.endDate))) 
                      )
                  }
                }
            res.send(shopReport);
        })
        
        //cash colelction report

        app.get('/cash-collection-report',async(req,res)=>{
            let page = req.query.page || 1 ;
            let cashCount = await dueRecoveryCollection.aggregate([
                { "$addFields": { "srId": { "$toObjectId": "$seller_id" }}},
                { "$addFields": { "shopId": { "$toObjectId": "$shop_id" }}},
                { "$lookup": {
                    "from": "shops",
                    "localField": "shopId",
                    "foreignField": "_id",
                    "as": "shopDetails"
                  }},
                  {
                      $unwind: {
                        path: "$shopDetails",
                      }
                    },
                    {"$addFields":{"regionID":{"$toObjectId":"$shopDetails.region_id"}}},
                    {
                        "$lookup":{
                            "from":"regions",
                            "localField":"regionID",
                            "foreignField":"_id",
                            "as":"shopDetails.region"
                        }
                    },
                    {
                        $unwind:{
                            path:"$shopDetails.region"
                        }
                    },
                    {
                        "$lookup":{
                            "from":"DueTracking",
                            "localField":"shop_id",
                            "foreignField":"shop_id",
                            "as":"dueDetails"
                        }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "srId",
                    "foreignField": "_id",
                    "as": "userDetails"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails",
                    }
                  },
                  { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails.asm",
                      }
                    },
                    { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                    { "$lookup": {
                        "from": "users",
                        "localField": "adminId",
                        "foreignField": "_id",
                        "as": "userDetails.asm.admin"
                      }},
                      {
                          $unwind: {
                            path: "$userDetails.asm.admin",
                          }
                        },
                        {
                          $count: "cashCollection"
                        },
                        {
                            "$project": {
                              "cashCollection":1,
                              "_id": 1,
                              "shopDetails.shop_name":1,
                              "shopDetails.address":1,
                              "shopDetails.region_id":1,
                              "shopDetails.region.region_name":1,
                              "dueDetails.due":1,
                              "issue_date":1,
                              "bill_link":1,
                              "paying_amount":1,
                              "userDetails._id":1,
                              "userDetails.name":1,
                              "userDetails.managed_by":1,
                              "regionDetails.region_name":1,
                              "userDetails.asm.name":1,
                              "userDetails.asm.managed_by":1,
                              "userDetails.asm.admin.name":1,
                            }
                          }
            ]).toArray();
            const countOfcollection = cashCount[0].cashCollection;
            const paginateData = pagination(countOfcollection,page);
            let cashReport = await dueRecoveryCollection.aggregate([
              { "$addFields": { "srId": { "$toObjectId": "$seller_id" }}},
              { "$addFields": { "shopId": { "$toObjectId": "$shop_id" }}},
              { "$lookup": {
                  "from": "shops",
                  "localField": "shopId",
                  "foreignField": "_id",
                  "as": "shopDetails"
                }},
                {
                    $unwind: {
                      path: "$shopDetails",
                    }
                  },
                  {"$addFields":{"regionID":{"$toObjectId":"$shopDetails.region_id"}}},
                  {
                      "$lookup":{
                          "from":"regions",
                          "localField":"regionID",
                          "foreignField":"_id",
                          "as":"shopDetails.region"
                      }
                  },
                  {
                      $unwind:{
                          path:"$shopDetails.region"
                      }
                  },
                  {
                      "$lookup":{
                          "from":"DueTracking",
                          "localField":"shop_id",
                          "foreignField":"shop_id",
                          "as":"dueDetails"
                      }
                  },
              { "$lookup": {
                  "from": "users",
                  "localField": "srId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                  $unwind: {
                    path: "$userDetails",
                  }
                },
                { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
              { "$lookup": {
                  "from": "users",
                  "localField": "asmId",
                  "foreignField": "_id",
                  "as": "userDetails.asm"
                }},
                {
                    $unwind: {
                      path: "$userDetails.asm",
                    }
                  },
                  { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                  { "$lookup": {
                      "from": "users",
                      "localField": "adminId",
                      "foreignField": "_id",
                      "as": "userDetails.asm.admin"
                    }},
                    {
                        $unwind: {
                          path: "$userDetails.asm.admin",
                        }
                      },
                      {
                          "$project": {
                            "cashCollection":1,
                            "_id": 1,
                            "shopDetails.shop_name":1,
                            "shopDetails.address":1,
                            "shopDetails.region_id":1,
                            "shopDetails.region.region_name":1,
                            "dueDetails.due":1,
                            "issue_date":1,
                            "bill_link":1,
                            "paying_amount":1,
                            "userDetails._id":1,
                            "userDetails.name":1,
                            "userDetails.managed_by":1,
                            "regionDetails.region_name":1,
                            "userDetails.asm.name":1,
                            "userDetails.asm.managed_by":1,
                            "userDetails.asm.admin.name":1,
                          }
                        },
                        { '$facet'    : {
                          data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                      } }
          ]).toArray();
            const data = cashReport[0].data;
            const result = { data, paginateData};
            res.send(result)
        })
        //cash colelction report filtered

        app.get('/filtered-cash-collection-report',async(req,res)=>{
            let query = {};
            let cashReport = await dueRecoveryCollection.aggregate([
                { "$addFields": { "srId": { "$toObjectId": "$seller_id" }}},
                { "$addFields": { "shopId": { "$toObjectId": "$shop_id" }}},
                { "$lookup": {
                    "from": "shops",
                    "localField": "shopId",
                    "foreignField": "_id",
                    "as": "shopDetails"
                  }},
                  {
                      $unwind: {
                        path: "$shopDetails",
                      }
                    },
                    {"$addFields":{"regionID":{"$toObjectId":"$shopDetails.region_id"}}},
                    {
                        "$lookup":{
                            "from":"regions",
                            "localField":"regionID",
                            "foreignField":"_id",
                            "as":"shopDetails.region"
                        }
                    },
                    {
                        $unwind:{
                            path:"$shopDetails.region"
                        }
                    },
                    {
                        "$lookup":{
                            "from":"DueTracking",
                            "localField":"shop_id",
                            "foreignField":"shop_id",
                            "as":"dueDetails"
                        }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "srId",
                    "foreignField": "_id",
                    "as": "userDetails"
                  }},
                  {
                    $unwind: {
                      path: "$userDetails",
                    }
                  },
                  { "$addFields": { "asmId": { "$toObjectId": "$userDetails.managed_by" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "asmId",
                    "foreignField": "_id",
                    "as": "userDetails.asm"
                  }},
                  {
                      $unwind: {
                        path: "$userDetails.asm",
                      }
                    },
                    { "$addFields": { "adminId": { "$toObjectId": "$userDetails.asm.managed_by" }}},
                    { "$lookup": {
                        "from": "users",
                        "localField": "adminId",
                        "foreignField": "_id",
                        "as": "userDetails.asm.admin"
                      }},
                      {
                          $unwind: {
                            path: "$userDetails.asm.admin",
                          }
                        },
                        {
                            "$project": {
                              "_id": 1,
                              "shopDetails.shop_name":1,
                              "shopDetails.address":1,
                              "shopDetails.region_id":1,
                              "shopDetails.region.region_name":1,
                              "dueDetails.due":1,
                              "issue_date":1,
                              "bill_link":1,
                              "paying_amount":1,
                              "userDetails._id":1,
                              "userDetails.name":1,
                              "userDetails.managed_by":1,
                              "regionDetails.region_name":1,
                              "userDetails.asm.name":1,
                              "userDetails.asm.managed_by":1,
                              "userDetails.asm.admin.name":1,
                            }
                          }
            ]).toArray();
            if(req.query.shopName || req.query.adminName || req.query.asmName || req.query.zoneName ||req.query.srName || req.query.zoneName){
                if(req.query.startDate===req.query.endDate){
                    cashReport= cashReport.filter(sc=>
                        (sc.shopDetails.shop_name===(req.query.shopName==="null"?sc.shopDetails.shop_name : req.query.shopName )) &&
                        (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                        (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                        (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                        (sc.shopDetails.region.region_name === (req.query.zoneName==="null"? sc.shopDetails.region.region_name : req.query.zoneName )) &&
                        ((sc.issue_date).split("T")[0]===(req.query.startDate==="null"? (sc.issue_date).split("T")[0] : req.query.startDate))
                      )
                  }else{
                    cashReport= cashReport.filter(sc=>
                        (sc.shopDetails.shop_name===(req.query.shopName==="null"?sc.shopDetails.shop_name : req.query.shopName )) &&
                        (sc.userDetails.asm.admin.name===(req.query.adminName==="null"?sc.userDetails.asm.admin.name: req.query.adminName  )) &&
                        (sc.userDetails.asm.name===(req.query.asmName==="null"?sc.userDetails.asm.name: req.query.asmName  ))  &&
                        (sc.userDetails.name===(req.query.srName==="null"? sc.userDetails.name : req.query.srName)) &&
                        (sc.shopDetails.region.region_name === (req.query.zoneName==="null"? sc.shopDetails.region.region_name : req.query.zoneName )) &&
                        ((sc.issue_date).split("T")[0] >=(req.query.startDate==="null"?(sc.issue_date).split("T")[0]: (req.query.startDate))) &&
                        ((sc.issue_date).split("T")[0]<=(req.query.endDate==="null"?(sc.issue_date).split("T")[0] : (req.query.endDate))) 
                      )
                  }
                }
            res.send(cashReport)
        })

        //admin distribution to asm 
        app.get('/admin-send-asm',async(req,res)=>{
            let page = req.query.page || 1;
            let reportCount = await distributedProductsCollection.aggregate([
                { "$addFields": { "admin": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "asm": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "admin",
                    "foreignField": "_id",
                    "as": "adminUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$adminUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "asm",
                    "foreignField": "_id",
                    "as": "asmUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                      $unwind: {
                        path: "$productDetails",
                      }
                    },
                { "$addFields": { "regionId": { "$toObjectId": "$asmUserDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "asmUserDetails.regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails.regionDetails",
                      }
                    },
                    {
                      $count:"tot"
                    },
                    {
                        "$project": {
                          "tot":1,
                          "_id": 1,
                          "sender_id":1,
                          "product_name":1,
                          "distributed_amount":1,
                          "recieved_date":1,
                          "reciever_id":1,
                          "adminUserDetails.name":1,
                          "asmUserDetails.name":1,
                          "asmUserDetails.region_id":1,
                          "productDetails.category":1,
                          "productDetails.secondary_category":1,
                          "productDetails.unit_price":1,
                          "asmUserDetails.regionDetails.region_name":1
                        }
                    },
            ]).toArray();
            const totalRow = reportCount[0].tot;
            const paginateData = pagination(totalRow,page);
            let report = await distributedProductsCollection.aggregate([
                { "$addFields": { "admin": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "asm": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "admin",
                    "foreignField": "_id",
                    "as": "adminUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$adminUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "asm",
                    "foreignField": "_id",
                    "as": "asmUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                      $unwind: {
                        path: "$productDetails",
                      }
                    },
                { "$addFields": { "regionId": { "$toObjectId": "$asmUserDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "asmUserDetails.regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails.regionDetails",
                      }
                    },
                    {
                        "$project": {
                          "_id": 1,
                          "sender_id":1,
                          "product_name":1,
                          "distributed_amount":1,
                          "recieved_date":1,
                          "reciever_id":1,
                          "adminUserDetails.name":1,
                          "asmUserDetails.name":1,
                          "asmUserDetails.region_id":1,
                          "productDetails.category":1,
                          "productDetails.secondary_category":1,
                          "productDetails.unit_price":1,
                          "asmUserDetails.regionDetails.region_name":1
                        }
                    },
                    { '$facet'    : {
                      data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                  } }
            ]).toArray();
            const data = report[0].data;
            const result = {data,paginateData}
            res.send(result)
        })
        //admin distribution to asm filtered
        app.get('/filtered-admin-send-asm',async(req,res)=>{
            let query ={};
            let report = await distributedProductsCollection.aggregate([
                { "$addFields": { "admin": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "asm": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "admin",
                    "foreignField": "_id",
                    "as": "adminUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$adminUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "asm",
                    "foreignField": "_id",
                    "as": "asmUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                      $unwind: {
                        path: "$productDetails",
                      }
                    },
                { "$addFields": { "regionId": { "$toObjectId": "$asmUserDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "asmUserDetails.regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails.regionDetails",
                      }
                    },
                    {
                        "$project": {
                          "_id": 1,
                          "sender_id":1,
                          "product_name":1,
                          "distributed_amount":1,
                          "recieved_date":1,
                          "reciever_id":1,
                          "adminUserDetails.name":1,
                          "asmUserDetails.name":1,
                          "asmUserDetails.region_id":1,
                          "productDetails.category":1,
                          "productDetails.secondary_category":1,
                          "productDetails.unit_price":1,
                          "asmUserDetails.regionDetails.region_name":1
                        }
                    }
            ]).toArray();
            console.log(req.query.productName);
            if(req.query.productName || req.query.adminName || req.query.asmName || req.query.zoneName ||req.query.srName || req.query.zoneName || req.query.category){
                if(req.query.startDate===req.query.endDate){
                    report= report.filter(sc=>
                        (sc.product_name===(req.query.productName==="null"? sc.product_name: req.query.productName )) &&
                        (sc.adminUserDetails.name===(req.query.adminName==="null"?sc.adminUserDetails.name: req.query.adminName  )) &&
                        (sc.asmUserDetails.name===(req.query.asmName==="null"?sc.asmUserDetails.name: req.query.asmName  ))  &&
                        (sc.asmUserDetails.regionDetails.region_name === (req.query.zoneName==="null"? sc.asmUserDetails.regionDetails.region_name : req.query.zoneName )) &&
                        (sc.productDetails.category===(req.query.category==="null"?sc.productDetails.category : req.query.category))&&
                        ((sc.recieved_date).split("T")[0]===(req.query.startDate==="null"? (sc.recieved_date).split("T")[0] : req.query.startDate))
                      )
                  }else{
                    report= report.filter(sc=>
                        (sc.product_name===(req.query.productName==="null"?sc.product_name : req.query.productName )) &&
                        (sc.adminUserDetails.name===(req.query.adminName==="null"?sc.adminUserDetails.name: req.query.adminName  )) &&
                        (sc.asmUserDetails.name===(req.query.asmName==="null"?sc.asmUserDetails.name: req.query.asmName  ))  &&
                        (sc.asmUserDetails.regionDetails.region_name === (req.query.zoneName==="null"? sc.asmUserDetails.regionDetails.region_name : req.query.zoneName )) &&
                        (sc.productDetails.category===(req.query.category==="null"?sc.productDetails.category : req.query.category))&&
                        ((sc.recieved_date).split("T")[0] >=(req.query.startDate==="null"?(sc.recieved_date).split("T")[0]: (req.query.startDate))) &&
                        ((sc.recieved_date).split("T")[0]<=(req.query.endDate==="null"?(sc.recieved_date).split("T")[0] : (req.query.endDate))) 
                      )
                  }
                }
            res.send(report)
        })

        //asm distribution to sr
        app.get('/asm-send-sr',async(req,res)=>{
            let page = req.query.page || 1;
            let report = await distributeToSrCollection.aggregate([
                { "$addFields": { "asm": { "$toObjectId": "$sender_id" }}},
                { "$addFields": { "sr": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                    "from": "users",
                    "localField": "asm",
                    "foreignField": "_id",
                    "as": "asmUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$asmUserDetails",
                      }
                    },
                { "$lookup": {
                    "from": "users",
                    "localField": "sr",
                    "foreignField": "_id",
                    "as": "srUserDetails"
                  }},
                  {
                      $unwind: {
                        path: "$srUserDetails",
                      }
                    },
                    { "$addFields": { "admin": { "$toObjectId": "$asmUserDetails.managed_by" }}},
                    { "$lookup": {
                        "from": "users",
                        "localField": "admin",
                        "foreignField": "_id",
                        "as": "asmUserDetails.admin"
                      }},
                      {
                          $unwind: {
                            path: "$asmUserDetails.admin",
                          }
                        },
                { "$lookup": {
                    "from": "products",
                    "localField": "product_name",
                    "foreignField": "product_name",
                    "as": "productDetails"
                  }},
                  {
                      $unwind: {
                        path: "$productDetails",
                      }
                    },
                { "$addFields": { "regionId": { "$toObjectId": "$srUserDetails.region_id" }}},
                { "$lookup": {
                    "from": "regions",
                    "localField": "regionId",
                    "foreignField": "_id",
                    "as": "srUserDetails.regionDetails"
                  }},
                  {
                      $unwind: {
                        path: "$srUserDetails.regionDetails",
                      }
                    },
                    {
                      $count:"prodCount"
                    },
                    {
                        "$project": {
                          "prodCount":1,
                          "_id": 1,
                          "sender_id":1,
                          "product_name":1,
                          "distributed_amount":1,
                          "recieved_date":1,
                          "reciever_id":1,
                          "asmUserDetails.name":1,
                          "srUserDetails.name":1,
                          "srUserDetails.region_id":1,
                          "productDetails.category":1,
                          "productDetails.secondary_category":1,
                          "productDetails.unit_price":1,
                          "srUserDetails.regionDetails.region_name":1,
                          "asmUserDetails.admin.name":1,
                        }
                    }
            ]).toArray();
            const totCount = report[0].prodCount;
            const paginateData = pagination(totCount,page);
            report = await distributeToSrCollection.aggregate([
              { "$addFields": { "asm": { "$toObjectId": "$sender_id" }}},
              { "$addFields": { "sr": { "$toObjectId": "$reciever_id" }}},
              { "$lookup": {
                  "from": "users",
                  "localField": "asm",
                  "foreignField": "_id",
                  "as": "asmUserDetails"
                }},
                {
                    $unwind: {
                      path: "$asmUserDetails",
                    }
                  },
              { "$lookup": {
                  "from": "users",
                  "localField": "sr",
                  "foreignField": "_id",
                  "as": "srUserDetails"
                }},
                {
                    $unwind: {
                      path: "$srUserDetails",
                    }
                  },
                  { "$addFields": { "admin": { "$toObjectId": "$asmUserDetails.managed_by" }}},
                  { "$lookup": {
                      "from": "users",
                      "localField": "admin",
                      "foreignField": "_id",
                      "as": "asmUserDetails.admin"
                    }},
                    {
                        $unwind: {
                          path: "$asmUserDetails.admin",
                        }
                      },
              { "$lookup": {
                  "from": "products",
                  "localField": "product_name",
                  "foreignField": "product_name",
                  "as": "productDetails"
                }},
                {
                    $unwind: {
                      path: "$productDetails",
                    }
                  },
              { "$addFields": { "regionId": { "$toObjectId": "$srUserDetails.region_id" }}},
              { "$lookup": {
                  "from": "regions",
                  "localField": "regionId",
                  "foreignField": "_id",
                  "as": "srUserDetails.regionDetails"
                }},
                {
                    $unwind: {
                      path: "$srUserDetails.regionDetails",
                    }
                  },
                  {
                      "$project": {
                        "_id": 1,
                        "sender_id":1,
                        "product_name":1,
                        "distributed_amount":1,
                        "recieved_date":1,
                        "reciever_id":1,
                        "asmUserDetails.name":1,
                        "srUserDetails.name":1,
                        "srUserDetails.region_id":1,
                        "productDetails.category":1,
                        "productDetails.secondary_category":1,
                        "productDetails.unit_price":1,
                        "srUserDetails.regionDetails.region_name":1,
                        "asmUserDetails.admin.name":1,
                      }
                  },
                  { '$facet'    : {
                    data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                } }
          ]).toArray();
          const data = report[0].data;
          const result = {data,paginateData};
            res.send(result)
        })

      //for filtering asm to sr report
        app.get('/filtered-asm-send-sr',async(req,res)=>{
          let query ={};
          let report = await distributeToSrCollection.aggregate([
              { "$addFields": { "asm": { "$toObjectId": "$sender_id" }}},
              { "$addFields": { "sr": { "$toObjectId": "$reciever_id" }}},
              { "$lookup": {
                  "from": "users",
                  "localField": "asm",
                  "foreignField": "_id",
                  "as": "asmUserDetails"
                }},
                {
                    $unwind: {
                      path: "$asmUserDetails",
                    }
                  },
              { "$lookup": {
                  "from": "users",
                  "localField": "sr",
                  "foreignField": "_id",
                  "as": "srUserDetails"
                }},
                {
                    $unwind: {
                      path: "$srUserDetails",
                    }
                  },
                  { "$addFields": { "admin": { "$toObjectId": "$asmUserDetails.managed_by" }}},
                  { "$lookup": {
                      "from": "users",
                      "localField": "admin",
                      "foreignField": "_id",
                      "as": "asmUserDetails.admin"
                    }},
                    {
                        $unwind: {
                          path: "$asmUserDetails.admin",
                        }
                      },
              { "$lookup": {
                  "from": "products",
                  "localField": "product_name",
                  "foreignField": "product_name",
                  "as": "productDetails"
                }},
                {
                    $unwind: {
                      path: "$productDetails",
                    }
                  },
              { "$addFields": { "regionId": { "$toObjectId": "$srUserDetails.region_id" }}},
              { "$lookup": {
                  "from": "regions",
                  "localField": "regionId",
                  "foreignField": "_id",
                  "as": "srUserDetails.regionDetails"
                }},
                {
                    $unwind: {
                      path: "$srUserDetails.regionDetails",
                    }
                  },
                  {
                      "$project": {
                        "_id": 1,
                        "sender_id":1,
                        "product_name":1,
                        "distributed_amount":1,
                        "recieved_date":1,
                        "reciever_id":1,
                        "asmUserDetails.name":1,
                        "srUserDetails.name":1,
                        "srUserDetails.region_id":1,
                        "productDetails.category":1,
                        "productDetails.secondary_category":1,
                        "productDetails.unit_price":1,
                        "srUserDetails.regionDetails.region_name":1,
                        "asmUserDetails.admin.name":1,
                      }
                  }
          ]).toArray();
          if(req.query.productName || req.query.asmName || req.query.srName || req.query.zoneName ||req.query.srName || req.query.zoneName || req.query.category){
              if(req.query.startDate===req.query.endDate){
                  report= report.filter(sc=>
                      (sc.product_name===(req.query.productName==="null"? sc.product_name: req.query.productName )) &&
                      (sc.asmUserDetails.name===(req.query.asmName==="null"?sc.asmUserDetails.name: req.query.asmName  )) &&
                      (sc.srUserDetails.name===(req.query.srName==="null"?sc.srUserDetails.name: req.query.srName  ))  &&
                      (sc.srUserDetails.regionDetails.region_name === (req.query.zoneName==="null"? sc.srUserDetails.regionDetails.region_name : req.query.zoneName )) &&
                      (sc.productDetails.category===(req.query.category==="null"?sc.productDetails.category : req.query.category))&&
                      ((sc.recieved_date).split("T")[0]===(req.query.startDate==="null"? (sc.recieved_date).split("T")[0] : req.query.startDate))
                    )
                }else{
                  report= report.filter(sc=>
                      (sc.product_name===(req.query.productName==="null"?sc.product_name : req.query.productName )) &&
                      (sc.asmUserDetails.name===(req.query.asmName==="null"?sc.asmUserDetails.name: req.query.asmName  )) &&
                      (sc.srUserDetails.name===(req.query.srName==="null"?sc.srUserDetails.name: req.query.srName  ))  &&
                      (sc.srUserDetails.regionDetails.region_name === (req.query.zoneName==="null"? sc.srUserDetails.regionDetails.region_name : req.query.zoneName )) &&
                      (sc.productDetails.category===(req.query.category==="null"?sc.productDetails.category : req.query.category))&&
                      ((sc.recieved_date).split("T")[0] >=(req.query.startDate==="null"?(sc.recieved_date).split("T")[0]: (req.query.startDate))) &&
                      ((sc.recieved_date).split("T")[0]<=(req.query.endDate==="null"?(sc.recieved_date).split("T")[0] : (req.query.endDate))) 
                    )
                }
              }
          res.send(report)
      })
        //get all due for different shops

        app.get('/due',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = dueTrackingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        
        //get core products

        app.get('/core-products',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = coreProductsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        
        //get user against id

        app.get('/due-recovery',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = dueRecoveryCollection.find(query).sort({issue_date:-1});
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/users/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all primary items
        
        app.get('/items',async(req,res)=>{
            const query = {};
            const cursor = primaryItemCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all transactions
        
        app.get('/transaction',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = transactionCollection.find(query).sort({issue_date:1});
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all shops

        app.get('/shop',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = shopsCollection.find(query).sort({created_at:-1});
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/paginated-shops',async(req,res)=>{
          let page= req.query.page || 1;
          let countDoc, shopdata,paginateData ;
          if(req.query.managed_by){
            countDoc=await shopsCollection.countDocuments({managed_by:req.query.managed_by});            
            paginateData  = pagination(countDoc,page)            
            shopdata =await shopsCollection.find({managed_by:req.query.managed_by}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
          }else{
            countDoc=await shopsCollection.countDocuments({});
            paginateData  = pagination(countDoc,page)            
            shopdata =await shopsCollection.find({}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
          }
          console.log(paginateData);
          const shops = {
           shopdata,paginateData
          }
          res.send(shops);
      })
      
        
        // get shop against id

        app.get('/shop/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const cursor = shopsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all divisions

        app.get('/division',async(req,res)=>{
            const query = {};
            const result = await divisionCollection.find(query).toArray();
            res.send(result);
        })

        //get all districts

        app.get('/district',async(req,res)=>{
            const query = {};
            const result = await districtCollection.find(query).toArray();
            res.send(result);
        })

        //get all subdistricts

        app.get('/subdistrict',async(req,res)=>{
            const query = {};
            const result = await subDistrictCollection.find(query).toArray();
            res.send(result);
        })

        //get all thana

        app.get('/thana',async(req,res)=>{
            const query = {};
            const cursor = thanaCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all regions

        app.get('/region',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = regionsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        //paginate region
        app.get('/paginate-region',async(req,res)=>{
            let page =req.query.page || 1;
            const totalRegions = await regionsCollection.countDocuments({});
            const paginateData = pagination(totalRegions,page);
            const data = await regionsCollection.find({}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
            const result = {data,paginateData};
            res.send(result);
        })

        //get region against id

        app.get('/region/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)};
            const cursor = regionsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        
        //get all product

        app.get('/product',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query
            }
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        //paginate product
        app.get('/paginate-product',async(req,res)=>{
            let page = req.query.page || 1 ;
            const totalProducts = await productsCollection.countDocuments({});
            const  paginateData = pagination(totalProducts,page);
            const data= await productsCollection.find({}).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
            const result = {data,paginateData};
            res.send(result);
        })

        //get products with proper item name

        app.get('/product-collection',async(req,res)=>{
            const products = await productsCollection.aggregate([
                { "$addFields": { "itemId": { "$toObjectId": "$item_id" }}},
                { "$lookup": {
                  "from": "primaryItem",
                  "localField": "itemId",
                  "foreignField": "_id",
                  "as": "itemDetails"
                }}
              ]).toArray();
            res.send(products);
        })

        //get all products from products collection

        app.get('/all-products',async(req,res)=>{
            const query = {};
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get distribution details to asm

        app.get('/distribution-details-asm',async(req,res)=>{
            const query = {};
            const cursor = distributedProductsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get distribution details to sr

        app.get('/distribution-details-sr',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = distributeToSrCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

    

        //paginate distributed sr
        app.get('/paginate-distribution-details-sr/:page',async(req,res)=>{
            let page =req.params.page ;
            let query ;
            if(req.query){
              query = req.query;
            }
            const totalDist = await distributeToSrCollection.countDocuments(query);
            const paginateData = pagination(totalDist,page);
            const data = await distributeToSrCollection.find(query).skip(paginateData.skippedIndex).limit(paginateData.perPage).toArray();
            const result = {data,paginateData};
            res.send(result);
        })
        //get all distributed products joining user for user details
        
        app.get('/distributed-product',async(req,res)=>{
            const distributedProducts = await distributedProductsCollection.aggregate([
                { "$addFields": { "itemId": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                  "from": "users",
                  "localField": "itemId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                    "$project": {
                      "_id": 1,
                      "product_name":1,
                      "distributed_amount":1,
                      "sender_id":1,
                      "recieved_date":1,
                      "userDetails._id":1,
                      "userDetails.name":1
                    }
                  }
            
              ]).toArray();
              res.send(distributedProducts)
        })
        //paginate data
        app.get('/paginate-distributed-product',async(req,res)=>{
          let page = req.query.page || 1;
            const distributedProductsCount = await distributedProductsCollection.aggregate([
                { "$addFields": { "itemId": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                  "from": "users",
                  "localField": "itemId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                  $count:"totProd"
                },
                {
                    "$project": {
                      "totProd":1,
                      "_id": 1,
                      "product_name":1,
                      "distributed_amount":1,
                      "sender_id":1,
                      "recieved_date":1,
                      "userDetails._id":1,
                      "userDetails.name":1
                    }
                  }
            
              ]).toArray();
              const totProd = distributedProductsCount[0].totProd;
              const paginateData = pagination(totProd,page);
              const distributedProducts = await distributedProductsCollection.aggregate([
                { "$addFields": { "itemId": { "$toObjectId": "$reciever_id" }}},
                { "$lookup": {
                  "from": "users",
                  "localField": "itemId",
                  "foreignField": "_id",
                  "as": "userDetails"
                }},
                {
                    "$project": {
                      "totProd":1,
                      "_id": 1,
                      "product_name":1,
                      "distributed_amount":1,
                      "sender_id":1,
                      "recieved_date":1,
                      "userDetails._id":1,
                      "userDetails.name":1
                    }
                  },
                  { '$facet'    : {
                    data: [ { $skip:paginateData.skippedIndex }, { $limit: paginateData.perPage } ] // add projection here wish you re-shape the docs
                } }
            
              ]).toArray();              
              const data = distributedProducts[0].data;
              const result = {data,paginateData};
              res.send(result);
        })
        
        //get item against item id

        app.get('/items/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)};
            const cursor = primaryItemCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        
        
        //get user role from user and role table
        app.get('/user-role',async(req,res)=>{

        })
        
        //get all layers of item
        app.get('/item-layers',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const cursor = layersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all layers of item against id
        app.get('/item-layers/:id',async(req,res)=>{
            let id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const cursor = layersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get item against id

        app.get('/items/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)};
            const cursor = primaryItemCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        

        //get all admin whose region is not assigned

        app.get('/users-admin',async(req,res)=>{
            const query = {role:"1"};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })
        //get user against username

        app.get('/users/:id',async(req,res)=>{
            const userName =req.params.id;
            const query = {username:userName};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })
        
        //get divisions

        app.get('/divisions',async(req,res)=>{
            const query = {};
            const cursor = divisionCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get district against division
        
        app.get('/district/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {division_id:id};
            const cursor = districtCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        
        //get subdistrict against district
        app.get('/subdistrict/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {district_id:id};
            const cursor = subDistrictCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //admin's distribution sum

        

        //get summed product stock after recieving from admin
        app.get('/group-by-products',async(req,res)=>{
            const result = await distributedProductsCollection.aggregate(
                [{
                    $group : {_id:{"product_name":"$product_name","reciever_id":"$reciever_id",}, 
                    count:{$sum: { $convert: { input: "$distributed_amount", to: "int" } }}
                }}
                ]
             ).toArray();
             res.send(result);
        })
        //get summed product stock after recieving from asm
        app.get('/group-by-products-sr',async(req,res)=>{
            const result = await distributeToSrCollection.aggregate(
                [{
                    $group : {_id:{"product_name":"$product_name","reciever_id":"$reciever_id",}, 
                    count:{$sum: { $convert: { input: "$distributed_amount", to: "int" } }}
                }}
                ]
             ).toArray();
             res.send(result);
        })


        // get distribution sum to sr from asm

        app.get('/group-by-products-sender',async(req,res)=>{
            const result = await distributeToSrCollection.aggregate(
                [{
                    $group : {_id:{"product_name":"$product_name","sender_id":"$sender_id",}, 
                    count:{$sum: { $convert: { input: "$distributed_amount", to: "int" } }}
                }}
                ]
             ).toArray();
             res.send(result);
        })
        
        //get sum distribution sr to shop
        app.get('/group-by-products-sender-shop',async(req,res)=>{
            const result = await distributionToShopCollection.aggregate(
                [{
                    $group : {_id:{"product_name":"$product_name","sender_id":"$sender_id",}, 
                    count:{$sum: { $convert: { input: "$distributed_amount", to: "int" } }}
                }}
                ]
             ).toArray();
             res.send(result);
        })

        //show distributions of shop

        app.get('/distributed-product-to-shop',async(req,res)=>{
            let query ={};
            if(req.query){
                query = req.query;
            }
            const cursor = distributionToShopCollection.find(query).sort({transaction_id:-1});
            const result = await cursor.toArray();
            res.send(result);
        })

        //add admin
        app.post('/addAdmin',async(req,res)=>{
            const adminUser = req.body;
            const result = await userCollection.insertOne(adminUser);
            res.send(result);
        })

        //add item

        app.post('/items',async(req,res)=>{
            const item = req.body;
            const result = await primaryItemCollection.insertOne(item);
            res.send(result);
        })

        //add a transcation

        app.post('/transaction',async(req,res)=>{
            const item = req.body;
            const result = await transactionCollection.insertOne(item);
            res.send(result);
        })

        //add a due recovery

        app.post('/due-recovery',async(req,res)=>{
            const item = req.body;
            const result = await dueRecoveryCollection.insertOne(item);
            res.send(result);
        })

        //add a due 

        app.post('/due',async(req,res)=>{
            const item = req.body;
            const result = await dueTrackingCollection.insertOne(item);
            res.send(result);
        })

        //add region 

        app.post('/region',async(req,res)=>{
            const region = req.body;
            const result = await regionsCollection.insertOne(region);
            res.send(result);
        })

        //add layers of existing items

        app.post('/item-layers',async(req,res)=>{
            const item = req.body;
            const result = await layersCollection.insertOne(item);
            res.send(result);
        })

        //add a product
        app.post('/products',async(req,res)=>{
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })

        //add a product in core
        app.post('/core-products',async(req,res)=>{
            const product = req.body;
            const result = await coreProductsCollection.insertOne(product);
            res.send(result);
        })

        //add distribute product

        app.post('/distributed-product',async(req,res)=>{
            const distributeProduct = req.body;
            const result = await distributedProductsCollection.insertOne(distributeProduct);
            res.send(result);
        })

        //add distribute to sr

        app.post('/distributed-product-to-sr',async(req,res)=>{
            const distributeProduct = req.body;
            const result = await distributeToSrCollection.insertOne(distributeProduct);
            res.send(result);
        })

        //add distribution product to shop

        app.post('/distributed-product-to-shop', async(req,res)=>{
            const sendShop = req.body;
           
            console.log(sendShop.img);
            const result = await distributionToShopCollection.insertOne(sendShop);
            res.send();
        })

        app.post("/img-upload",upload.single("image"),async(req,res)=>{
            console.log(req.body);
            const file = req.file;
            console.log(file);
            const path =`uploads/`.concat(file.filename);
            res.send(path); 

        })
        app.post('/api/images',upload.single("image"), (req, res) => {
            const file = req.file;
            console.log(file.filename);
            const path =`uploads/`.concat(file.filename);
            res.send(path); 
          })
        //add a shop

        app.post('/shop',async(req,res)=>{
            const shop = req.body;
            const result = await shopsCollection.insertOne(shop)
            res.send(result);
        })

        //update user

        app.put('/users/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const user = req.body;
            const option = {upsert:true};
            const updatedUser ={
                $set:{
                        password:user.password,
                
                }
            }
            const result = await userCollection.updateOne(filter, updatedUser,option);
            res.send(result);
        })

        //update user region

        app.put('/users-region/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const user = req.body;
            const option = {upsert:true};
            const updatedUser ={
                $set:{
                        password:user.regionId,
                
                }
            }
            const result = await userCollection.updateOne(filter, updatedUser,option);
            res.send(result);
        })
        //update cv of users

        app.put('/users-cv/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const user = req.body;
            const option = {upsert:true};
            const updatedUser ={
                $set:{
                        cv:user.cv,                
                }
            }
            const result = await userCollection.updateOne(filter, updatedUser,option);
            res.send(result);
        })
        
        //upsert due 

        app.put('/due/:id',async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const user = req.body;
            const option = {upsert:true};
            const updateDue ={
                $set:{
                        due:user.due               
                }
            }
            const result = await dueTrackingCollection.updateOne(filter, updateDue,option);
            res.send(result);
        })
        //update category layer

        app.put('/item-layers/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const layerItem = req.body;
            const option = {upsert:true};
            const updatedUser ={
                $set:{
                        layers:layerItem                 
                }
            }
            const result = await layersCollection.updateOne(filter, updatedUser,option);
            res.send(result);
        })
        
        //update a region to assign admin

        app.put('/region/:id',async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const region = req.body;
            const option = {upsert:true};
            const updateRegion = {
                $set:{
                    assigned:region.assign
                }
            }
            const result = await regionsCollection.updateOne(filter,updateRegion,option);
            res.send(result);
        })

        //update product stock

        app.put('/product-collection',async(req,res)=>{
            const product = req.body;
            const negAmount = parseInt(product.distributed_amount);
            const product_name = product.product_name;
            const query = {product_name:product_name};
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            const existingNumber = parseInt(result[0].total_pieces);
            const newAmount = (existingNumber-negAmount).toString();
            const filter = {product_name:product.product_name};
            const option = {upsert:true};
            const updateProduct ={
                $set:{
                    total_pieces:newAmount                   
                 }
            }
            const finalResult = await productsCollection.updateOne(filter, updateProduct,option);
            res.send(finalResult);
        })

        // app.get('/set-date', async(req,res)=>{
        //     const id = req.params.id;
        //     const filter = {};
        //     const option = {upsert:true};
        //     const curdate = "2023-05-08T09:50:35.561Z";
        //     const updatedUser ={
        //         $set:{
        //                 created_date:curdate,
                
        //         }
        //     }
        //     const result = await regionsCollection.updateMany(filter, updatedUser,option);
        //     res.send(result);
        // })
 
    }
    finally{

    }
}

run().catch(err=>console.log(err));

app.get('/',(req,res)=>{
    res.send('Hello from Captain Pen Product server');
})
app.listen(port,()=>{
    console.log(`Listening to port ${port}`);
})