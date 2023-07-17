const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const bcrypt = require('bcryptjs');
const User = require('./assets/models/user.js');
const avatarUrl = (UserId, avatarHash) => `https://cdn.discordapp.com/avatars/${UserId}/${avatarHash}`;
const app = express();
const config = require('./config.json')
require('dotenv').config()
try {

const args = process.argv.slice(2);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions'
});

store.on('error', function(error) {
    console.log(error);
});

const readline = require('readline');

// Create an interface for reading input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define the available commands and their actions
const commands = [
  { command: 'stop', aliases: ['kill', 'shutdown', 'turn off'], action: () => turnOff() }
];

// Function to perform the "turn off" action
function turnOff() {
  console.log('Turning off...');
  // Add your code here to perform the actual turn off action
  // For example, you can call a function or exit the script
  process.exit();
}

// Function to handle the user input
function handleInput(input) {
  const command = input.trim().toLowerCase();

  // Check if the input matches any of the defined commands or aliases
  const matchedCommand = commands.find(cmd => cmd.command === command || cmd.aliases.includes(command));

  if (matchedCommand) {
    // Execute the corresponding action
    matchedCommand.action();
  } else {
    console.log('Unknown command or alias');
  }

  // Prompt for the next input
  rl.prompt();
}

// Set up the prompt
rl.setPrompt('');
rl.prompt();

// Register the input event listener
rl.on('line', handleInput);

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },
}));
  
app.use('/assets', express.static(path.join(__dirname + '/assets/')));
app.use('/site.webmanifest', express.static(path.join(__dirname + '/assets/images/site.webmanifest')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/index.html', { encoding: 'utf8' });
    page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
    res.send(page);  
})

app.get('/acc-edit', async (req, res) => {
  if (req.session.userId) {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/acc-editor.html', { encoding: 'utf8' })
        .replace('{avatar}', avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar))
    res.send(page);
  } else {
    const alertMessage = 'You need to be logged in to access this page.';
    res.setHeader('Content-Type', 'text/html');
    res.write(`<script>alert("${alertMessage}");window.location.href="/login";document.getElementById("openSidebarMenu").checked = false;</script>`);
    res.end();
  }
})

app.post('/acc-edit', async (req, res) => {
  if(req.session.userId) {
    if(Object.keys(req.query).length === 0) {
      const alertMessage = 'No query provided.';
      res.setHeader('Content-Type', 'text/html');
      res.write(`<script>alert("${alertMessage}");window.history.back();document.getElementById("openSidebarMenu").checked = false;</script>`);
      res.end();
    } else {
      if(req.query === "username=1") {
        let username = req.body.username;
        if(username === await User.findOne({ username: username })) {
          const alertMessage = 'The username is same as one before.';
          res.setHeader('Content-Type', 'text/html');
          res.write(`<script>alert("${alertMessage}");window.history.back();document.getElementById("openSidebarMenu").checked = false;</script>`);
          res.end();
        } else {
          await User.findOneAndUpdate({ deleteProtocol: 1 }, { username: username }, { new: true })
        }
      } else if (req.query === "password=1") {
        let password = req.body.password;
        if(password === await User.findOne({ password: password })) {
          const alertMessage = 'The password issame as one before.';
          res.setHeader('Content-Type', 'text/html');
          res.write(`<script>alert("${alertMessage}");window.history.back();document.getElementById("openSidebarMenu").checked = false;</script>`);
          res.end();
        } else {
          await User.findOneAndUpdate({ deleteProtocol: 1 }, { password: password }, { new: true })
        }
      } else if (req.query === "email=1") {
        let email = req.body.email;
        if(email === await User.findOne({ email: email })) {
          const alertMessage = 'The email is same as one before.';
          res.setHeader('Content-Type', 'text/html');
          res.write(`<script>alert("${alertMessage}");window.history.back();document.getElementById("openSidebarMenu").checked = false;</script>`);
          res.end();
        } else {
          User.findOneAndUpdate({ deleteProtocol: 1 }, { email: email }, { new: true })
        }
      } else if (req.query === "profile=1") {
        const alertMessage = 'This feature is disabled.';
        res.setHeader('Content-Type', 'text/html');
        res.write(`<script>alert("${alertMessage}");window.history.back();document.getElementById("openSidebarMenu").checked = false;</script>`);
        res.end();
      }
    }
  }
})

app.get('/api/projects', async (req, res) => {
  const getPost = require('./handler/api/post.js')
  res.send(await getPost())
})

app.get('/projects', async (req, res) => {
  const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
  const getPost = require('./handler/post.js')
    if(Object.keys(req.query).length === 0) {
        if (req.session.userId) {
            let page = fs.readFileSync('./assets/html/projectsAdmin.html', { encoding: 'utf8' });
            page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
            page = page.replace('{posts}', await getPost())
            res.send(page);  
          } else {
            let page = fs.readFileSync('./assets/html/projects.html', { encoding: 'utf8' });
            page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
            page = page.replace('{posts}', await getPost())
            res.send(page);  
          }
        } else {
            const search = require('./assets/models/upload.js');
            const id = req.query.p;
            const project = await search.findOne({ projectId: id });
            if (!project) {
              return res.redirect('/404');
            } else {
              let projectData = project.toJSON();
              const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
              let page = fs.readFileSync('./assets/html/project.html', { encoding: 'utf8' })
              page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
              page = page.replace('{title}', projectData.projectName)
              page = page.replace('{description}', projectData.projectDesc)
              page = page.replace('{link}', projectData.projectLink)
              page = page.replace('{projectDate}', projectData.projectDate);
              res.send(page);
            }
          }
})

app.get('/projects/create', async (req, res) => {
    if (req.session.userId) {
      const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
      let page = fs.readFileSync('./assets/html/project-create.html', { encoding: 'utf8' });
      page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
      res.send(page);  
    } else {
        const alertMessage = 'This page requires administrator access.';
        res.setHeader('Content-Type', 'text/html');
        res.write(`<script>alert("${alertMessage}");window.history.back();closeSidebar()</script>`);
        res.end();
      }
})
const { v4: uuidv4 } = require('uuid');
const uploadModel = require('./assets/models/upload.js');

app.post('/api/project/:request', async (req, res) => {
  const request = req.params.request;
  const projectId = req.query.id;

  if (req.session.userId) {
    if (request === "new") {
      const link = req.body.link;
      const title = req.body.title;
      const description = req.body.description;
      const currentDate = new Date();
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      const id = generateUniqueID();
      console.log('Generated ID:', id);

      // Check if the generated ID already exists in the database
      const isIdUsed = await checkIfIdExistsInDatabase(id);
      console.log('ID is already used:', isIdUsed);

      if (isIdUsed) {
        // If the ID already exists, generate a new unique ID
        const newId = generateUniqueID();
        console.log('Generated new unique ID:', newId);

        // Set the new ID as the project ID
        const data = new uploadModel({
          projectId: newId,
          projectDesc: description,
          projectName: title,
          projectLink: link,
          projectDate: formattedDate
        });
        data.save().then(() => {
          res.redirect('/projects/');
        });

      } else {
        // Set the generated ID as the project ID
        const data = new uploadModel({
          projectId: id,
          projectDesc: description,
          projectName: title,
          projectLink: link,
          projectDate: formattedDate
        });
        data.save().then(() => {
          res.redirect('/projects/');
        });

      }
    }
  } else {
    const alertMessage = 'This API request requires administrator access.';
    res.setHeader('Content-Type', 'text/html');
    res.write(`<script>alert("${alertMessage}");window.history.back();closeSidebar()</script>`);
    res.end();
  }
});

// Function to generate a unique ID
function generateUniqueID() {
  return uuidv4().replace(/-/g, '').slice(0, 10);
}

// Function to check if an ID exists in the database
async function checkIfIdExistsInDatabase(id) {
  const existingData = await uploadModel.findOne({ projectId: id });
  return !!existingData;
}

app.get('/aboutt', async (req, res) => {
  const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
  let page = fs.readFileSync('./assets/html/aboutt.html', { encoding: 'utf8' });
  page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
  res.send(page);  
})

app.get('/about', async (req, res) => {
  const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
  let page = fs.readFileSync('./assets/html/about.html', { encoding: 'utf8' });
  page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
  res.send(page);  
})


app.get('/copyrights', async (req, res) => {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/copyrights.html', { encoding: 'utf8' });
    page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
    res.send(page);  
})

app.post('/login', async function(req, res) {
  const lookup = req.body.lookup;
  const password = req.body.password;
  console.log(password);
  try {
    const user = await User.findOne({ $or: [{ username: lookup }, { email: lookup }] });
    if (!user) {
      const alertMessage = "Failed to look up the account. It doesn't exist in the database.";
      res.setHeader('Content-Type', 'text/html');
      res.write(`<script>alert("${alertMessage}");closeSidebar();window.history.back();</script>`);
      res.end();
    } else {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.userId = user._id;
        const alertMessage = 'Account Found! Redirecting you to the admin page.';
        res.setHeader('Content-Type', 'text/html');
        res.send(`
          <script>
            alert("${alertMessage}");
            window.location.href = "/";
          </script>
        `);
      } else {
        const alertMessage = 'The password you entered is incorrect.';
        res.setHeader('Content-Type', 'text/html');
        res.write(`<script>alert("${alertMessage}");window.history.back();closeSidebar()</script>`);
        res.end();
      }
    }
  } catch (error) {
    console.log(error);
    res.send('An error occurred');
  }
});


  app.post('/uploadProject', async function(req, res) {
    if (req.session.userId) {
    const crypto = require('crypto');
    const uploadData = require('./assets/models/upload.js');

    async function generateUniqueId() {
      let uniqueId = null;
      let post = null;
    
      while (!uniqueId || post) {
        uniqueId = crypto.randomBytes(6).toString('hex'); // Generates a unique ID with 12 characters
        post = await uploadData.findOne({ id: uniqueId });
      }
    
      return uniqueId;
    }

    const uniqueId = await generateUniqueId()
    const projectName = req.body.projectName;
    const projectDesc = req.body.projectDesc;
    const projectData = req.body.projectData;
    const projectDate = req.body.projectDate;
    const data = new uploadData({
      projectId: uniqueId,
      projectName: projectName,
      projectDesc: projectDesc,
      projectData: projectData,
      projectDate: projectDate
    })
    await data.save()
    res.redirect('/projects')
    } else {
      res.redirect('/404')
    }
  })

if(config.log === true) {
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));

} else if(args.includes('--maintenance') || args.includes('-m')) {
  app.get('/login', async (req, res) => {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/login-reg.html', { encoding: 'utf8' });
    page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
    res.send(page);  
  });

  app.get('/register', async function(req, res) {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/register.html', { encoding: 'utf8' });
    page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
    res.send(page);  
  })
  app.post('/register', function(req, res) {
    const bcrypt = require('bcryptjs');
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const UserData = require('./assets/models/user.js');
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds)
      .then((hash) => {
       if(UserData.find()) {
        UserData.deleteMany({ deleteProtocol: 1 })
        .then(() => {
          const data = new UserData({
            deleteProtocol: 1,
            username: username,
            email: email,
            password: hash
          })
          data.save();
        })
        .catch((error) => {
          const alertMessage = 'A error occurred! Check console for more details';
          res.setHeader('Content-Type', 'text/html');
          res.write(`<script>alert("${alertMessage}");window.location.href="/login";</script>`);
          res.end();
          console.log(error)
        });      

       } else {
        const data = new UserData({
          deleteProtocol: 1,
          username: username,
          email: email,
          password: hash
        })
        data.save();  
       }
             // Send an alert to the previous page
      const alertMessage = 'The account has been created and overwrited the old one! Remember to turn off maintenance mode so no one else can overwrite this account.';
      res.setHeader('Content-Type', 'text/html');
      res.write(`<script>alert("${alertMessage}");window.location.href="/login";document.getElementById("openSidebarMenu").checked = false;</script>`);
      res.end();
    })
    .catch((error) => {
      console.error(error);
      // Send an alert with the error message to the previous page
      const alertMessage = 'An error occurred while processing your request. Please try again later.';
      res.setHeader('Content-Type', 'text/html');
      res.write(`<script>alert("${alertMessage}");window.history.back();</script>`);
      res.end();
    });
    });
    if(config.port) {
      app.listen(config.port, function() {
        console.log(`Hey, server is running on port ${config.port}! Maintenance Mode Activated!`)
    })
    } else {
      app.listen(3000, function() {
        console.log(`Hey, server is running on port 3000! Maintenance Mode Activated!`)
    })
    }
} else {

  app.get('/login', async (req, res) => {
    const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
    let page = fs.readFileSync('./assets/html/index.html', { encoding: 'utf8' });
    page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
    res.send(page);  
  });
  if(config.port) {
    app.listen(config.port, function() {
      console.log(`Hey, server is running on port ${config.port}`)
  })
  } else {
    app.listen(3000, function() {
      console.log(`Hey, server is running on port 3000`)
  })
  }
}

app.use(async (req, res, next) => {
  const { data } = await axios.get('https://api.lanyard.rest/v1/users/669947245776338994');
  let page = fs.readFileSync('./assets/html/index.html', { encoding: 'utf8' });
  page = page.replace(/{avatar}/g, avatarUrl(data.data.discord_user.id, data.data.discord_user.avatar));
  res.status(404).send(page)
})

} catch (err) { 
  console.log(err)
}