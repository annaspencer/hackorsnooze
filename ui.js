$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $submitStoryBtn = $("#submitStoryBtn");
  const $favoriteStoryBtn = $("#favoriteStoryBtn");
  const $myStoryButton = $("#myStoryButton");
  const $favoritedStories = $("#favorited-articles")
  
 
  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~on clicks~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// favorite 
$(".star").on("click", async function(evt) {
    evt.preventDefault();
    let user = currentUser;

    await user.addToFavorites(evt)
    location.reload();
  })
// delete
  $("#my-articles").on("click", ".trash-can", async function(evt) {
    evt.preventDefault();
    let user = currentUser
     await StoryList.deleteStory(evt, user);
    location.reload();
  })
  // go to favorites list
  $favoriteStoryBtn.on("click", async function(evt){
    evt.preventDefault();
    hideElements();
    putFavoritesListOnPage();
  })
// got to own stories list
  $myStoryButton.on("click", async function(evt){
    evt.preventDefault();
    hideElements();
    putUserStoriesOnPage();
  })
// open submit form
  $submitStoryBtn.on("click", async function(evt) {
    evt.preventDefault(); 
    $submitForm.show()
  })
// submit story
  $submitForm.on("submit", async function(evt){
    evt.preventDefault();  
    let author = $("#author").val();
    let title = $("#title").val();
    let url = $("#url").val();

    const story = {
        author,
        title,
        url, 
    }
    let user = currentUser;
    let result = await StoryList.addStory(user, story);
    const storyHTML = generateStoryHTML(result.data.story);
    $allStoriesList.append(storyHTML);
    $ownStories.push(result.data.story);
    location.reload();

  })

  // log in
  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); 
    const username = $("#login-username").val();
    const password = $("#login-password").val();
    const userInstance = await User.login(username, password);
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
    location.reload()
  });

// create acount
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); 
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });
// log out
  $navLogOut.on("click", function() {
    localStorage.clear();
    location.reload();
  });

// submit login
  $navLogin.on("click", function() {
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });
// shows all story feed
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });



// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~story  generation~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  
// story instance
async function generateStories() {
    const storyListInstance = await StoryList.getStories();
    storyList = storyListInstance;
    $allStoriesList.empty();
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

    /* simple function to pull the hostname from a URL */

    function getHostName(url) {
      let hostName;
      if (url.indexOf("://") > -1) {
        hostName = url.split("/")[2];
      } else {
        hostName = url.split("/")[0];
      }
      if (hostName.slice(0, 4) === "www.") {
        hostName = hostName.slice(4);
      }
      return hostName;
    }

  // story HTML
  function generateStoryHTML(story, showDeleteBtn = false) {
    let hostName = getHostName(story.url);
    const showStar = Boolean(currentUser);
    const storyMarkup = $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
       ${showStar ?  getStarHTML(story, currentUser) : ""}
      
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~favorites front end functions~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // show favorites
 function putFavoritesListOnPage() {
    $favoritedStories.empty();
    if (currentUser.favorites.length === 0) {
      $favoritedStories.append("<h5>No favorites added!</h5>");
    } else {
      for (let story of currentUser.favorites) {
        const $story = generateStoryHTML(story);
        $favoritedStories.append($story);
      }
    }
  
    $favoritedStories.show();
  }

  // show star
  function getStarHTML(story, user) {
    const isFavorite = user.isFavorite(story);
    const starType = isFavorite ? "fas" : "far";
    return `
        <span class="star">
          <i class="${starType} fa-star"></i>
        </span>`;
 }
//  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~user story & deletion front end~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// show delete button for user created stories
  function getDeleteBtnHTML() {
    return `
        <span class="trash-can">
          <i class="fas fa-trash-alt"></i>
        </span>`;
  }
// show user created stories
  function putUserStoriesOnPage() {
    $ownStories.empty();
    if (currentUser.ownStories.length === 0) {
      $ownStories.append("<h5>No stories added!</h5>");
    } else {
      for (let story of currentUser.ownStories) {
        const $story = generateStoryHTML(story, showDeleteBtn = true);
        $ownStories.append($story);
      }
    }
  
    $ownStories.show();
  }


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~nav displays~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $favoritedStories
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    
    $navLogin.hide();
    $navLogOut.show();
    $submitStoryBtn.show();
    $favoriteStoryBtn.show();
    $myStoryButton.show();
  }

  async function checkIfLoggedIn() {
    
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();
  
    if (currentUser) {
      showNavForLoggedInUser();
    }
  }
  function loginAndSubmitForm() {
    $loginForm.hide();
    $createAccountForm.hide();
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");
    $allStoriesList.show();

    showNavForLoggedInUser();
  }
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~local storage~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});


