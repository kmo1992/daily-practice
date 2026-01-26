// src/components/NutritionListPanel.jsx

import React from 'react';
import { FaLeaf } from 'react-icons/fa';

const allowedFoods = [
  {
    title: 'Protein',
    detail:
      'Beef, pork, chicken, turkey, duck, fowl, fish, seafood, shellfish, eggs\n' +
      'Bacon (with nitrates or sugar or celery salt)',
  },
  {
    title: 'Vegetables & legumes',
    detail:
      'Most veggies\n' +
      'Winter squashes\n' +
      'Sweet potatoes, yams*\n' +
      'White potatoes, corn*\n' +
      'Beans and legumes*\n' +
      'Fermented soy (tempeh, miso)',
  },
  {
    title: 'Fruit',
    detail: 'All fruits*\nLemon and lime juice',
  },
  {
    title: 'Nuts & seeds',
    detail:
      'Most nuts and seeds (including nut butters)*\n' +
      'Peanuts (including peanut butter)*',
  },
  {
    title: 'Fats & oils',
    detail:
      'Olive oil, coconut oil, avocado oil, butter, pork fat (lard), beef fat (tallow), duck fat,\n' +
      'nut oils, flaxseed oil, grapeseed oil\n' +
      'Avocados, coconuts, olives\n' +
      'Industrial vegetable & seed oils (canola, corn, peanut, safflower, soy, sunflower)*',
  },
  {
    title: 'Grains',
    detail:
      'Rice (white, brown, wild), quinoa, oatmeal, buckwheat, amaranth*\n' +
      'Corn tortillas*',
  },
  {
    title: 'Alcohol & beverages',
    detail: 'Coffee, tea, kombucha, coconut water\nVegetable juice*\nWine and spirits (1 per week)',
  },
  {
    title: 'Dairy',
    detail: 'Butter\nYogurt, kefir, whey protein, cottage cheese',
  },
  {
    title: 'Sugar & sweeteners',
    detail: 'Stevia, monkfruit\nCoconut sugar and nectar',
  },
  {
    title: 'Snacks & artificial ingredients',
    detail:
      'Sweet potato or vegetable fries or chips, baked*\n' +
      'White potato fries, baked*\n' +
      'Sweet potato fries, fried*\n' +
      'Hummus\n' +
      'Guar gum, xanthan gum, arrowroot, tapioca, natural or artificial flavors or colors*',
  },
];

function NutritionListPanel() {
  return (
    <div className="nutrition-list-panel">
      <div className="nutrition-allowed">
        <div className="nutrition-allowed-grid">
          {allowedFoods.map((item) => (
            <div key={item.title} className="nutrition-allowed-card">
              <span className="nutrition-allowed-title">{item.title}</span>
              <span className="nutrition-allowed-detail">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>
      <span className="primer-note">
        <FaLeaf aria-hidden="true" /> Clean points, clean momentum.
      </span>
    </div>
  );
}

export default NutritionListPanel;
