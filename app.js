const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected!'))
  .catch(err => console.log(err));

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to our own DB"
});

const item2 = new Item({
  name: "Hit the + button to add new item"
});

const item3 = new Item({
  name: "Hit the checkbox to delete."
});

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


const defaultItems = [item1, item2, item3];

app.get("/", async function (req, res) {

  try {
    const items = await Item.find({});

    if (items.length === 0) {
      await Item.insertMany(defaultItems);
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  }
  catch (error) {
    console.log(error);
  }

});

app.get("/:CustomListName", async function (req, res) {
  const CustomListName = _.capitalize(req.params.CustomListName);

  try {
    const foundList = await List.findOne({ name: CustomListName });
    if (!foundList) {
      const list = new List({
        name: CustomListName,
        items: defaultItems
      });

      await list.save();
      res.redirect(`/${CustomListName}`);

    }

    else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  }

  catch (error) {
    console.log(error);
  }
});


app.post("/", async function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(item);
    await foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.itemCheckbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    try {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    }
    catch (error) {
      console.log(error);
    }
  }

  else {
    const foundList = await List.findOneAndUpdate({ name: listName }, {
      $pull: { items: { _id: checkedItemId }}});
      res.redirect("/" + listName);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
