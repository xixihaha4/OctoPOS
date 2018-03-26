import React from 'react';
import axios from 'axios';
export default class itemModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item_name: '',
      item_price: '',
      item_image: '',
      item_ingredients: [],
      item_category: '',
      categories: [],
      ingredients: [],
    }
    this.createItem = this.createItem.bind(this);
    this.handleIngredient = this.handleIngredient.bind(this);
  }

  handleIngredient(item, index) {
    console.log('hello', item, index)
    let clicked = document.getElementById(`modal-item_${index}`)
    clicked.style.color = (clicked.style.color === 'green') ? 'black' : 'green';

    if (clicked.style.color === 'green') {
      let temp = this.state.item_ingredients.slice();
      temp.push(item.ingredient_name);
      this.setState({ item_ingredients: temp }, () => console.log(this.state.item_ingredients))
    } else {
      let temp = this.state.item_ingredients.slice();
      let found = temp.indexOf(item.ingredient_name);
      temp.splice(found, 1);
      this.setState({ item_ingredients: temp }, () => console.log(this.state.item_ingredients))
    }

  }

  createItem() {
    let temp = this.state.item_ingredients.slice()
    let newItem = {}
    newItem['item_name'] = this.state.item_name;
    newItem['item_price'] = this.state.item_price;
    newItem['item_image'] = this.state.item_image;
    newItem['item_ingredients'] = JSON.stringify(temp);
    newItem['item_category'] = this.state.item_category;
    this.props.handleNewItem(newItem);
    this.props.closeModal('itemModal');

  }


  render() {
    console.log('hello')
    console.log(this.props)
    return (
      <div id="itemModal" className="itemModal animated fadeIn">
        <div className="modal-content-manager">
          <div className="modal-header-manager">
            <div className="modal-title">Create New Item</div>
            <div className="modal-close" onClick={() => this.props.closeModal('itemModal')}><i className="fas fa-times-circle"></i></div>
          </div>
          <div className="modal-body-manager">
            <input
              type="text"
              value={this.state.item_name}
              onChange={(e) => this.setState({ item_name: e.target.value }, () => console.log(this.state.item_name))}
              placeholder="Enter new Item Name"
            />
            <input
              type="Number"
              value={this.state.item_price}
              onChange={(e) => this.setState({ item_price: e.target.value }, () => console.log(this.state.item_price))}
              placeholder="Enter Item Price"
            />
            <input
              type="Text"
              value={this.state.item_image}
              onChange={(e) => this.setState({ item_image: e.target.value }, () => console.log(this.state.item_image))}
              placeholder="Enter an Image_URL or Upload a photo"
            />
            <div className="modal-ingredient-grid">
              {this.props.ingredients.map((ingredient, i) => {
                return <div onClick={() => this.handleIngredient(ingredient, i)} id={`modal-item_${i}`}>{ingredient.ingredient_name}</div>
              })}
            </div>
            <input
              type="Text"
              value={this.state.item_category}
              onChange={(e) => this.setState({ item_category: e.target.value }, () => console.log(this.state.item_category))}
              placeholder="Please enter the item category"
            />
            <button type="button" onClick={this.createItem}>
              <h3>Create Item</h3>
            </button>
          </div>
          <div className="modal-footer-manager">Please Pick</div>
        </div>
      </div>
    )
  }
}