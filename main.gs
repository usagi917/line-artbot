const CHANNEL_ACCESS_TOKEN = ''; // LINE Botのアクセストークン
const OPENAI_API_KEY = ""; // OpenAIのAPIキー
const DALLE_API = "https://api.openai.com/v1/images/generations"; // DALL-E API URL

// POSTリクエストを受け取る関数
function doPost(e) {
  if (!e || !e.postData) {
    console.error('postData is undefined');
    return ContentService.createTextOutput(JSON.stringify({'error': 'Bad Request'}))
      .setMimeType(ContentService.MimeType.JSON).setResponseCode(400);
  }

  const json = JSON.parse(e.postData.contents);
  const replyToken = json.events[0].replyToken;
  if (!replyToken) {
    console.error('Reply token is missing');
    return;
  }

  const userMessage = json.events[0].message.text;

  generateImageURL(userMessage, replyToken);
}

// DALL-Eを使用して画像URLを生成し、LINEに返信する関数
function generateImageURL(text, replyToken) {
  const data = {
    'prompt': text,
    'model': 'dall-e-3',
    'response_format': 'url'
  };
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Bearer ' + OPENAI_API_KEY,
      'Content-Type': 'application/json'
    },
    'payload': JSON.stringify(data)
  };

  try {
    const response = UrlFetchApp.fetch(DALLE_API, options);
    const json = JSON.parse(response.getContentText());
    if (json.data && json.data[0].url) {
      const imageUrl = json.data[0].url;
      sendImageReply(replyToken, imageUrl);
    } else {
      sendReply(replyToken, [{'type': 'text', 'text': 'すまん！画像の生成に失敗しましたぞい。'}]);
    }
  } catch (e) {
    console.error('Failed to generate image: ' + e.toString());
    sendReply(replyToken, [{'type': 'text', 'text': 'すまん！画像の生成にエラーが発生してしまったぞい'}]);
  }
}

// LINEに画像を返信する関数
function sendImageReply(replyToken, imageUrl) {
  const messages = [{
    'type': 'image',
    'originalContentUrl': imageUrl,
    'previewImageUrl': imageUrl
  }];
  sendReply(replyToken, messages);
}

// LINEに返信する関数
function sendReply(replyToken, messages) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
  };
  const postData = {
    'replyToken': replyToken,
    'messages': messages
  };
  const options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(postData)
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    console.error('Error sending message: ' + e.toString());
  }
}
