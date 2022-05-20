const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const { redirect } = require("express/lib/response");
const bcrypt = require("bcryptjs");
const password = "purple-monkey-dinosaur"; // found in the req.params object
const hashedPassword = bcrypt.hashSync(password, 10);
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString() {
  let string = "";
  let char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++){
    string += char.charAt(Math.random() * char.length)
  }
  return string
};

const urlDatabase = {
  b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const urlsForUser = (id) => {
  let result = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].userID === id){
      result[key] = urlDatabase[key];
    }
  }
  return result;
}

const findUserEmail = (users, email) => {
  for (user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies.id;
  const user = users[userId]
  if (user) {
    const templateVars = {
      urls: filteredUrls,
      user,
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL,  userID: req.cookies.id};
  res.redirect(`/urls/ ${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
  } else {
  res.send({ statusCode: 400, message: "ShortURL does not exist" });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies.id;
  const user = users[userId]
  const templateVars = { user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL],};
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.id;
  const user = users[userId]
  if (user) {
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
  } else {
  res.redirect("/login");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userId = req.cookies.id;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user,
    };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    res.send({ statusCode: 400, message: "Please enter UserId or Password" });
  }
  const checkEmail = findUserEmail(users, email);
  if (checkEmail) {
    return res.send({ statusCode: 400, message: "Email already exist" });
  }
  const id = generateRandomString();
  res.cookie("id", id);
  users[id] = {
    id,
    email,
    hashedPassword,
  };
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userId = req.cookies.id;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  }});


app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, 10);
  let userId = findUserEmail(users, email);
  console.log(userId, email, password);
  if (email === "" || password === "") {
    res.send({ statusCode: 403, message: "Please enter UserId or Password" });
  }
  const checkEmail = findUserEmail(users, email);
  if (!bcrypt.compareSync(password, checkEmail.hashedPassword)) {
    res.send({ statusCode: 403, message: "Invalid UserId or Password" });
  }
  if (!checkEmail) {
    return res.send({ statusCode: 403, message: "E-mail cannot be found" });
  } else if (findUserEmail(users, email)) {
  const id = generateRandomString();
  res.cookie("id", id);
  users[id] = {
    id,
    email,
    password,
  }; 
  console.log("checkEmail==", checkEmail.hashedPassword); 
  res.redirect("/urls");
} else {
  res.status(403).send("Please register first");
}
});

app.post("/logout", (req, res) => {
  res.clearCookie("id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
