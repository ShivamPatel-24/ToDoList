const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.API)

const itemSchema = {
    name: String
};

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
    name: "Welcome to the todolist!"
})

const item2 = new Item({
    name: "Hit the + button to add a new item."
})

const item3 = new Item({
    name: "<--- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3]

const customItemsSchema = {
    name: String,
    items: [itemSchema]
}

const List = mongoose.model('List', customItemsSchema);


// sending the html to the home page
app.get('/', (req, res) => {

    Item.find({}, (err, foundItems) => {

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, err => {
                if (err) console.log(err);
                else console.log("Default items added successfully!")
            })
        }

        res.render("list", {listTitle: "Today", listItems: foundItems});
        
    })
  
})

// Templeting
app.get("/:customListName", (req, res) => {
    const custListName = _.capitalize(req.params.customListName);

    List.findOne({name: custListName}, (err, foundList) => {
        if (!err) {
            if (!foundList){
                const list = new List({
                    name: custListName,
                    items: defaultItems
                })       
                list.save();
                res.redirect('/' + custListName);
            }
            else res.render("list", {listTitle: foundList.name, listItems: foundList.items});
        }
        
    })
    
})

// fetching the input entered by the user on the main page
app.post('/', (req, res) => {
    let item = req.body.newItem;
    let listName = req.body.list;

    const newItem = new Item({
        name: item
    })

    if (listName === "Today"){
        newItem.save();
        res.redirect('/');
    }
    else{
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect('/' + listName);
        })
    }
    

})

// Delete item feature using delete and update method
app.post('/delete', (req, res) => {
    
    const id = req.body.checked;
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(id, (err) => {
            if (!err) {
                console.log("Item deleted successfully")
                res.redirect('/');
            }            
        })
    }

    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}}, (err, foundList) => {
                if (!err) res.redirect('/' + listName);
            }
        )
    }
    
})

let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log('Server started on port successfully')
});