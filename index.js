const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());


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
    const distributedProductsCollection = client.db('captainPenProduct').collection('distributedProducts');
    const distributeToSrCollection = client.db('captainPenProduct').collection('distributedProductsToSr');
    const distributionToShopCollection = client.db('captainPenProduct').collection('distributionToShop');
    const regionsCollection = client.db('captainPenProduct').collection('regions');
    const shopsCollection = client.db('captainPenProduct').collection('shops'); 
    const transactionCollection = client.db('captainPenProduct').collection('transaction'); 
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
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        })

        //get user against id

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
            const query = {};
            const cursor = transactionCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //get all shops

        app.get('/shop',async(req,res)=>{
            let query = {};
            if(req.query){
                query = req.query;
            }
            const result = await shopsCollection.find(query).toArray();
            res.send(result);
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
            const query = {};
            const cursor = distributeToSrCollection.find(query);
            const result = await cursor.toArray();
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
              res.send(distributedProducts);
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
            const query ={};
            const cursor = distributionToShopCollection.find(query);
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

        app.post('/distributed-product-to-shop',async(req,res)=>{
            const sendShop = req.body;
            const result = await distributionToShopCollection.insertOne(sendShop);
            res.send(result);
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
        
        //update category layer

        app.put('/item-layers/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id:new ObjectId(id)};
            const layerItem = req.body;
            const option = {upsert:true};
            const updatedUser ={
                $set:{
                        item_id:layerItem.item_id,
                        layers:layerItem.layers                   
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