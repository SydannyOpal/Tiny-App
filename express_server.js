const express = require("express");
const PORT = 8080; // default port 8080
const app = express();

const { redirect } = require("express/lib/response");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const urlDatabase = require("./lib/in-memory-db/URL-db");
const users = require("./lib/in-memory-db/Users");
const {
  findUserEmail,
  generateRandomString,
  urlsForUser,
} = require("./lib/helpers");

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key"],
  })
);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//Landing page for all users/ Dashboard for  for short urls
app.get("/urls", (req, res) => {
  const userId = req.session.userID;
  const user = users[userId];
  // console.log("from get /urls", user);
  if (user) {
    console.log("from get urls", urlDatabase);
    const filteredUrls = urlsForUser(userId, urlDatabase);
    const templateVars = {
      urls: filteredUrls,
      user,
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.userID,
  };
  res.redirect(`/urls/${shortURL}`);
});

//new user sign up via the navlink
app.get("/register", (req, res) => {
  const userId = req.session.userID;
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
//on submitting the form the new user is redirected to the urls landing page 
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
 const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    res.send({ statusCode: 400, message: "Please enter UserId or Password" });
  }
  const checkEmail = findUserEmail(users, email);
  if (checkEmail) {
    return res.send({ statusCode: 400, message: "Email already exist" });
  }
  const id = generateRandomString();
  req.session.userID = id;
  users[id] = {
    id: id,
    email: email,
    password: hashedPassword,
  };
  res.redirect("/urls");
});
//existing users access point 
app.get("/login", (req, res) => {
  const userId = req.session.userID;
  const user = users[userId];
  if (user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  }
});
//provided user info is validated access to urls will be granted
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserEmail(users, email);
  console.log("inside login:" + users);
  console.log("userid is:" + user.id);
  if (email === "" || password === "") {
    return res.send({
      statusCode: 403,
      message: "Please enter email or Password",
    });
  }
  if (!user) {
    return res.send({ statusCode: 403, message: "E-mail cannot be found" });
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.send({ statusCode: 403, message: "Invalid UserId or Password" });
  }
  req.session.userID = user.id;
  return res.redirect("/urls");
});
//nav link for logged in users to create short urls 
app.get("/urls/new", (req, res) => {
  const userId = req.session.userID;
  const user = users[userId];
  if (user) {
    const templateVars = {
      user,
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});
//storing/ sorting urls associated with a particular user
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  // urlDatabase[shortURL] = req.body.longURL;
  const templateVars = {
    user: users[urlDatabase[shortURL].userID],
    longURL: { longURL: urlDatabase[shortURL].longURL },
    shortURL,
  };
  res.render(`urls_show`, templateVars);
});
//urls page only showing a particular user's urls 
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});
//
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send({ statusCode: 400, message: "ShortURL does not exist" });
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.userID;
  const user = users[userId];
  const templateVars = {
    user,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});
//removes a short url from the dashboard
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
