//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//---Database---//
mongoose.connect("mongodb://localhost:27017/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});

//Create Item Schema
const itemsSchema = {
  name: String
};

//Create Mongoose Model
const Item = mongoose.model("Item", itemsSchema);

//Create 3 items
const gala = new Item({
  name: "Go the Gala"
});

const seduce = new Item({
  name: "Seduce the Prince"
});

const dress = new Item({
  name: "Buy a dress"
});

// Put all items in one array
const defaultItems = [gala,seduce, dress];

//--- Custom List ---//
//Create schema
const listSchema = {
  name: String, 
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//---Routes---//
app.get("/", function(req, res) {
  //Find Data
  Item.find({},function(err,foundItems){

    if(foundItems.length == 0){
      //Insert Data
      Item.insertMany(defaultItems, function(err){
        if(!err){
          console.log("Successfully inserted all items into the db");
        }
      });
      res.redirect("/"); 
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save(); //save the new items
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){ //For default list
    //Remove item
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+ listName);
      }
    });
  }

 
});

//Custom List
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        //Create a new List
        const list= new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      }else{
        //Show an existing list
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});
//PORT LISTEN
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
 
app.listen(port, function() {
  console.log("Server started succesfully");
});                                           
