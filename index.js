const OPENAI_API_KEY = ''; 
const url = 'https://api.openai.com/v1/images/generations';

const chatOutput = document.getElementById('chat-output');
const userInput = document.getElementById('user-input');
const submitButton = document.getElementById('submit-btn');
const clothesRecommendations = document.getElementById('clothes-recommendations');
const selectedClothesDiv = document.getElementById('selected-clothes');
const generateOutfitButton = document.getElementById('generate-outfit-btn');
const outfitImageContainer = document.getElementById('outfit-image-container');

const welcomeMessage = "👋 Hello! I'm your Virtual Fashion Assistant. I can help you find the perfect outfit for any season and style preference. Just tell me what you like!";
const seasons = ["Spring", "Summer", "Fall", "Winter"];
const styles = ["Casual", "Formal", "Sporty", "Elegant", "Traditional", "Party"];

// Helper function to create a bulleted point list
function createBulletedList(items) {
  const list = document.createElement('ul');
  items.forEach(item => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    list.appendChild(listItem);
  });
  return list;
}

// Welcome message with bulleted point lists for seasons and styles
appendMessage(welcomeMessage);

const seasonList = createBulletedList(seasons);
//const styleList = createBulletedList(styles);

appendMessage('Seasons:', false);
chatOutput.appendChild(seasonList);

//appendMessage('Styles:', false);
//chatOutput.appendChild(styleList)

let seasonPreference = null;
let stylePreference = null;
let outfitClothes = [];

// Helper function to add messages to the chat output
function appendMessage(message, isUser = false) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', isUser ? 'from-user' : 'from-ai');
  messageElement.textContent = message;
  chatOutput.appendChild(messageElement);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Helper function to create a checkbox for a clothing item
function createClothingCheckbox(clothingItem) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = 'clothing-item';
  checkbox.value = clothingItem;
  checkbox.id = clothingItem;
  checkbox.classList.add('clothing-checkbox');

  const label = document.createElement('label');
  label.htmlFor = clothingItem;
  label.textContent = clothingItem;

  const br = document.createElement('br');

  clothesRecommendations.appendChild(checkbox);
  clothesRecommendations.appendChild(label);
  clothesRecommendations.appendChild(br);
}

// Welcome message
//appendMessage(welcomeMessage);

// Event listener for user input and recommendations submission
submitButton.addEventListener('click', async () => {
  const userMessage = userInput.value.trim();
  userInput.value = '';
  appendMessage('You: ' + userMessage, true);

  // Process user input and generate response
  const response = await fetchBotReply(userMessage);
  appendMessage('Virtual Fashion Assistant: ' + response);
});

function showRecommendations() {
  // Display clothing recommendations based on season and style preferences
  const seasonStyleMessage = `Based on your preferences for ${seasonPreference} and ${stylePreference} style, I recommend the following clothing items:`;
  appendMessage('Virtual Fashion Assistant: ' + seasonStyleMessage);

  // Clear previous recommendations
  clothesRecommendations.innerHTML = '';

  // Add clothing recommendations to the list
  const recommendations = getOutfitRecommendations(seasonPreference, stylePreference);
  recommendations.forEach(createClothingCheckbox);

  // Show the list of recommendations and the outfit generation button
  clothesRecommendations.style.display = 'block';
  generateOutfitButton.style.display = 'block';
}

// Event listener for outfit generation
generateOutfitButton.addEventListener('click', generateOutfit);

function generateOutfit() {
  // Get selected clothing items
  outfitClothes = Array.from(document.querySelectorAll('.clothing-checkbox:checked'))
    .map(checkbox => checkbox.value);

  // Generate outfit image description
  if (seasonPreference && stylePreference && outfitClothes.length > 0) {
    const outfitDescription = `s${outfitClothes.join(', ')}.`;
    fetchImageUrl(outfitDescription);
  } else {
    appendMessage("Virtual Fashion Assistant: Please select the season, style, and clothing items first.");
  }
}

async function fetchBotReply(userInput) {
  try {
    if (seasons.includes(userInput)) {
      seasonPreference = userInput;
      return `Great choice! You selected ${seasonPreference}. Now, tell me your preferred style: ${styles.join(',')}.`;
    } else if (styles.includes(userInput)) {
      stylePreference = userInput;
      showRecommendations();
      return `Excellent! You prefer ${stylePreference} style. Now, let me recommend some clothing items for you.`;
    } else {
      const response = await fetchAPI(url, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENAI_API_KEY
        },
        body: JSON.stringify({
          'prompt': `Based on your preferences, I recommend the following outfit for ${userInput}`,
          'max_tokens': 100,
          'temperature': 0.8
        })
      });

      const data = await response.json();
      return data.choices[0].text.trim();
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchImageUrl(outfitDescription) {
  try {
    const response = await fetchAPI(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_API_KEY
      },
      body: JSON.stringify({
        'prompt': 'A full size portrait of a woman standing against a neutral background with the outfit clearly visible. showing the footwear is very important. Outfit Description:'+ outfitDescription,
        'n': 1,
        'size': '512x512',
        'response_format': 'b64_json'
      })
    });

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const imageData = data.data[0].b64_json;
      displayImage(imageData);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function displayImage(imageData) {
  const imageElement = document.createElement('img');
  imageElement.src = "data:image/png;base64," + imageData;
  imageElement.classList.add('outfit-image');
  outfitImageContainer.innerHTML = '';
  outfitImageContainer.appendChild(imageElement);
}

// Helper function to handle fetch and rate limits
async function fetchAPI(url, options) {
  const response = await fetch(url, options);
  if (response.status === 429) {
    // Handle rate limit by waiting and retrying the request after a delay
    const retryAfter = parseInt(response.headers.get('Retry-After')) || 1;
    await sleep(retryAfter * 1000);
    return fetchAPI(url, options); // Retry the request
  }
  return response;
}

// Helper function to introduce delay using setTimeout
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const imagePromptBase = "Give a short description of an image that could be used to advertise an outfit based on the following preferences:\n\nSeason: ";

// Replace this function with your outfit recommendation logic
function getOutfitRecommendations(seasonPreference, stylePreference) {
  // For the sake of example, let's define some clothing recommendations based on the season and style preferences.
  // In a real-world scenario, you would use your own recommendation logic and possibly an API to fetch clothing recommendations.
  const outfitRecommendations = {
    Spring: {
      Casual: ["floral dress", "sneakers", "sunglasses"],
      Formal: ["pastel suit", "heels", "pearl necklace"],
      Sporty: ["windbreaker jacket", "athletic shorts", "running shoes"],
      Elegant: ["flowy maxi dress", "pumps", "statement earrings"],
      Traditional: ["salwar kameez", "kolhapuri sandals", "jhumkas"],
      Party: ["sari", "stilettos", "clutch"],
    },
    Summer: {
      Casual: ["tank top", "denim shorts", "flip-flops"],
      Formal: ["linen suit", "loafers", "bracelet watch"],
      Sporty: ["athletic tank", "running shorts", "sports cap"],
      Elegant: ["off-shoulder dress", "wedge sandals", "diamond necklace"],
      Traditional: ["cotton kurta", "mojari", "jhumkas"],
      Party: ["flowy maxi dress", "strappy sandals", "chandelier earrings"],
    },
    Fall: {
      Casual: ["sweater", "jeans", "ankle boots"],
      Formal: ["trench coat", "tailored pants", "oxford shoes"],
      Sporty: ["hoodie", "joggers", "sneakers"],
      Elegant: ["midi dress", "knee-high boots", "pearl bracelet"],
      Traditional: ["silk saree", "embroidered blouse", "traditional jewelry"],
      Party: ["velvet dress", "pumps", "statement necklace"],
    },
    Winter: {
      Casual: ["knit sweater", "leggings", "winter boots"],
      Formal: ["wool coat", "dress pants", "brogue shoes"],
      Sporty: ["fleece jacket", "thermal leggings", "hiking boots"],
      Elegant: ["velvet dress", "fur stole", "crystal earrings"],
      Traditional: ["heavy embroidered shawl", "anarkali suit", "jutis"],
      Party: ["sequin dress", "ankle boots", "clutch"],
    },
  };

  if (seasonPreference && stylePreference) {
    return outfitRecommendations[seasonPreference][stylePreference];
  } else {
    return [];
  }
}