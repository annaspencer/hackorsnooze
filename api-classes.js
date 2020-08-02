const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }
// gets api story list~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
  static async getStories() {
    const response = await axios.get(`${BASE_URL}/stories`);
    const stories = response.data.stories.map(story => new Story(story));
    const storyList = new StoryList(stories);
    return storyList;
  }
// add story methods~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// adds story to api + user's own story list
  static async addStory(user, newStory) {
    let token = user.loginToken;
    const author = newStory.author;
    const title = newStory.title;
    const url = newStory.url;
    const addNew = {
      token,
      story: {
        author,
        title,
        url,
      }
    }
   
    const newStorRes = await axios.post(`${BASE_URL}/stories`, addNew)
    return newStorRes;

  }
  async addToOwnStories(story) {
    this.ownStories.push(story);
  } 

// Own story deletion methods~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// deletes story from api
   static async removeStory(user, storyId) {
     console.log(user)
    const token = user.loginToken;
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken }
    });
     
   }
// function for frontend to use to select story to be deleted
  static async deleteStory(evt, user) {
    const $closestLi = $(evt.target).closest("li");
    const storyId = $closestLi.attr("id");
    let currentUser = await User.getLoggedInUser(user.loginToken, user.username)
    await StoryList.removeStory(currentUser, storyId);
  }
}


/**
 * The User class to primarily represent the current user.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user methods~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });
    const newUser = new User(response.data.user);
    newUser.loginToken = response.data.token;
    return newUser;
  }

  /* Login in user and return user instance.*/

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });
    const existingUser = new User(response.data.user);
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.**/

  static async getLoggedInUser(token, username) {
    if (!token || !username) return null;
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });
    const existingUser = new User(response.data.user);
    existingUser.loginToken = token;
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }
// user back end favorites methods~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
 

// adds to user favorites list and updates api
  async addFavorite(story) {
    this.favorites.push(story);
    await this._addOrRemoveFavorite("add", story)
  }

// removes from user favorite list, and api
  async removeFavorite(story) {
    this.favorites = this.favorites.filter(s => s.storyId !== story.storyId);
    await this._addOrRemoveFavorite("remove", story);
  }

  /** Update API with favorite/not-favorite.**/
  async _addOrRemoveFavorite(newState, story) {
    const method = newState === "add" ? "POST" : "DELETE";
    const token = this.loginToken;
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: { token },
    });
  }
  
// uses add/remove favorites to toggle/untoggle star class
  async addToFavorites(evt) {
    let storyResponse = await StoryList.getStories();
    const $tgt = $(evt.target);
    const $closestLi = $tgt.closest("li");
    const storyId = $closestLi.attr("id");
    const story = storyResponse.stories.find(s => s.storyId === storyId);
    let currentUser = await User.getLoggedInUser(this.loginToken, this.username)
         // to star or unstar functionality
    if ($tgt.hasClass("fas")) {
      await currentUser.removeFavorite(story);
      $tgt.closest("i").toggleClass("fas far");
    } else {
      await currentUser.addFavorite(story);
      $tgt.closest("i").toggleClass("fas far");
      
    }
  }

  isFavorite(story) {
    return this.favorites.some(s => (s.storyId === story.storyId));
  }

}

/**
 * Class to represent a single story.~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */

class Story {

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}