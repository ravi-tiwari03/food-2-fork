import axios from 'axios';

export default class Recipe{
	constructor(id) {
		this.id = id;
	}

	async getRecipe() {
		try{
			const res = await axios(`https://forkify-api.herokuapp.com/api/get?&rId=${this.id}`);
			this.title = res.data.recipe.title;
			this.author = res.data.recipe.publisher;
			this.img = res.data.recipe.image_url;
			this.url = res.data.recipe.source_url;
			this.ingredients = res.data.recipe.ingredients;
			//console.log(res);
		}
		catch(error){
			console.log(error);
			alert('Something went wring :(');
		}
	}

	calcTime() {
		//assuming that we need 15 minutes for each 3 ingredients
		const numIng = this.ingredients.length;
		const periods = Math.ceil(numIng / 3);
		this.time = periods * 15
	}

	calcServings() {
		this.servings = 4;
	}

	parseIngredients() {
		const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
		const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
		const units = [...unitsShort, 'kg', 'g'];

		const newIngredients = this.ingredients.map(el => {
			//1.Uniform unit throughout
			let ingredient = el.toLowerCase();
			unitsLong.forEach((unit, i) => {
				ingredient = ingredient.replace(unit, unitsShort[i]);
			});

			//2.Remove parantheses
			ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

			//3.Parse ingredients into count, unit, ingredient itself
			const arrIng = ingredient.split(' ');
			const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

			let objIng;

			if(unitIndex > -1){
				//There is a unit
				//Eg: 4 1/2 cups, arrCount is [4, 1/2]
				//Eg: 4 cups, arrCount is[4]
				const arrCount = arrIng.slice(0, unitIndex);
				let count;
				if(arrCount === 1){
					count = eval(arrIng[0].replace('-', '+'));
				}
				else {
					count = eval(arrIng.slice(0, unitIndex).join('+'));
				}

				objIng = {
					count: count,
					unit: arrIng[unitIndex],
					ingredient: arrIng.slice(unitIndex + 1).join(' ')
				};

			}
			else if(parseInt(arrIng[0], 10)){
				//There is NO unit , but a number
				objIng = {
					count: parseInt(arrIng[0], 10),
					unit: '',
					ingredient: arrIng.slice(1).join(' ')
				};

			}
			else if(unitIndex === -1){
				//There is NO unit and NO number in first position
				objIng = {
					count: 1,
					unit: '',
					ingredient: ingredient //Can be just written as ingredient in ES6 instead of repeating it
				};
			}

			return objIng;

		});
		this.ingredients = newIngredients;
	}

	updateServings(type) {
		//Servings
		const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;


		//ingredients
		this.ingredients.forEach(ing => {
			ing.count = ing.count * (newServings / this.servings);
		});

		this.servings = newServings;
	}
}