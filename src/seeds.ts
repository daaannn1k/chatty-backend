import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { random } from 'lodash';
import axios from 'axios';
import { createCanvas } from 'canvas';

dotenv.config({});

function avatarColor(): string {
  const colors: string[] = [
    '#3e4f52',
    '#a2b6ae',
    '#8c736f',
    '#f9d4b3',
    '#4e5b6e',
    '#c4a289',
    '#7d5a82',
    '#b2e4d1',
    '#f47e71',
    '#6d8b87',
    '#b0c4ab',
    '#e89b8c',
    '#758c95',
    '#f2bd94',
    '#a69d92',
    '#436f8e',
    '#d2b092',
    '#587c80',
    '#cf7f5b',
    '#8d6a92'
  ];

  const randomColor: string = colors[random(colors.length - 1)];
  return randomColor;
}

function generateAvator(text: string, backgroundColor: string, foregroundColor = 'white') {
  const canvas = createCanvas(200, 200);
  const context = canvas.getContext('2d');

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.font = 'normal 80px sans-serif';
  context.fillStyle = foregroundColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}

async function seedUserData(count: number): Promise<void> {
  let i = 0;

  try {
    for (i = 0; i < count; i++) {
      let username;
      username = faker.person.firstName();
      const color = avatarColor();
      const avatar = generateAvator(username.charAt(0).toUpperCase(), color);

      if (username.length > 7) {
        username = username.slice(0, 7);
      }
      const body = {
        username,
        email: faker.internet.email(),
        password: 'qwerty',
        avatarColor: color,
        avatarImage: avatar
      };

      console.log(`***ADDING USER TO DATABASE - ${i + 1} of ${count} - ${username}`);
      await axios.post(`${process.env.API_URL}/signup`, body);
    }
  } catch (error) {
    console.log(error);
  }
}

seedUserData(10);
