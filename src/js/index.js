 Global app controller
import str from './models/Search';
import {add as a, multiply as m, ID} from './views/searchView';
import * as searchView from './views/searchView';
console.log(`Using imported functions! ${searchView.add(searchView.ID, 2)} and ${searchView.multiply(3, 5)}. ${str}`);

http://forkify-api.herokuapp.com/

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';

GLobal State of the app
*- Search Object
*-CUrrent recipe object
*-Shopping list object
*-liked recipes


/*
**SEARCH CONTROLLER
*/
const state = {};

const controlSearch = async () => {
	//we should get the query from the view
	const query = searchView.getInput();

	//if there's a query we want to create a new search object
	if(query) {
		//new search object and add to state
		state.search = new Search(query);

		//prepare the user interface for result
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			//search for recipes
			await state.search.getResults();

			//render results on UI (only after gettingresult from API so we use await and therefore this is an async function)
			//console.log(state.search.result);
			clearLoader();
			searchView.renderResults(state.search.result);

		}
		catch(error){
			alert('Something wrong with the search...');
			clearLoader();
		}
	}
}

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});




elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if(btn){
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
		console.log(goToPage);
	}
});


/*
**RECIPE CONTROLLER
*/

const controlRecipe = async () => {

	//Get the id from URL
	const id = window.location.hash.replace('#', '');


	if(id) {
		//Prepare UI for chnages
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		//Highlight Selected Search item
		if(state.search){
			searchView.highlightSelected(id);
		}

		//Create a new recipe object
		state.recipe = new Recipe(id);

		try {
			//Get recipe data and parse ingredients
			//this promise may not always resolve, therefore we are adding the try catch block because we want all if this to happen only if we het back data from the server
			await state.recipe.getRecipe();
			console.log(state.recipe.ingredients);
			state.recipe.parseIngredients();

			//Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			//Render the Recipe
			console.log(state.recipe);
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)
				);
		}
		catch(error){
			console.log(error);
		}
	}
};

window.addEventListener('hashchange', controlRecipe);
window.addEventListener('load', controlRecipe);



['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/*
**LIST CONTROLLER
*/

const controlList = () => {
	//Create a new list if there is none yet
	if(!state.list){
		state.list = new List();
	}
	//Add each ingredient to the list and the UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	//Handle the delete button
	if(e.target.matches('.shopping__delete, .shopping__delete *')){
		//Delete form state
		state.list.deleteItem(id);

		//Delete form UI
		listView.deleteItem(id);
	}
	//Handle the count update
	else if(e.target.matches('.shopping__count-value')){
		const val = parseFloat(e.target.value,10);
		state.list.updateCount(id, val);
	}
});

/*
**LIKES CONTROLLER
*/

const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;


	//User has not yet liked current recipe
	if(!state.likes.isLiked(currentID)) {
		//Add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
			);
		//toggle the like button
		likesView.toggleLikeBtn(true);

		//Add like to the UI list
		likesView.renderLike(newLike);
		//console.log(state.likes);
	}
	//User has liked current recipe
	else{
		//Remove like from the state

		state.likes.deleteLike(currentID);

		//toggle the like button
		likesView.toggleLikeBtn(false);

		//Remove like from the UI list
		likesView.deleteLike(currentID);
		console.log(state.likes);

	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//Restore Liked recipes on pageload

window.addEventListener('load', () => {
	state.likes = new Likes();

	//Restore Likes
	state.likes.readStorage();

	//toggle likeMenu button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	//Render the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});


//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')){
		//Decrease button is clicked
		if(state.recipe.servings > 1){
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	}
	else if(e.target.matches('.btn-increase, .btn-increase *')) {
		//Increase button is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	}
	else if(e.target.matches('.recipe__btn--add, recipe__btn--add *')){
		//Add ingredients to shopping list
		controlList();
	}
	else if(e.target.matches('.recipe__love, .recipe__love *')){
		//Like controller
		controlLike();
	}
	console.log(state.recipe);
});
