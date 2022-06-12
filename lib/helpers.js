const findUserEmail = (users, email) => {
  for (user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
};

function generateRandomString() {
  let string = "";
  let char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    string += char.charAt(Math.random() * char.length);
  }
  return string;
}

const urlsForUser = (id, urlDatabase) => {
  let result = {};
  for (key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      result[key] = urlDatabase[key];
    }
  }
  return result;
};

module.exports = { findUserEmail, generateRandomString, urlsForUser };
