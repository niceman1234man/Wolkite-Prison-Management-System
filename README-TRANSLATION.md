# Azure Translator Integration

This document provides instructions on how to set up and use the Azure Translator integration in the Wolkite Prison Management System.

## Setup Instructions

1. Create an Azure account if you don't have one already at [portal.azure.com](https://portal.azure.com)
2. Create a Translator resource:
   - Go to the Azure portal
   - Click "Create a resource"
   - Search for "Translator"
   - Select "Translator" and click "Create"
   - Fill out the required information (subscription, resource group, region, name)
   - Click "Review + create" and then "Create"

3. Get your API key:
   - Once the resource is deployed, go to your Translator resource
   - In the left menu, click on "Keys and Endpoint"
   - Copy one of the keys (either KEY 1 or KEY 2)
   - Note the region and endpoint URL

4. Update your `.env` file in the backend directory with the following variables:
   ```
   # Azure Translator API credentials
   AZURE_TRANSLATOR_KEY=your_key_here
   AZURE_TRANSLATOR_REGION=your_region_here
   AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
   ```

## Features

The Azure Translator integration provides the following features:

1. **Automatic translation** of user interface elements between English and Amharic
2. **Language selector** available in the header of key pages
3. **Translation API endpoints** for text, batch, and object translation
4. **Persistent language preference** saved in browser localStorage

## Components

The integration consists of the following components:

- `TranslatedText` and `T` components for easy text translation in React components
- `LanguageSelector` component for switching between languages
- `LanguageContext` provider for managing language state
- Backend translation API endpoints
- Azure Translator service utilities

## Usage

### In React Components

To translate text in a React component:

```jsx
import { T } from '../components/common/TranslatedText';

function MyComponent() {
  return (
    <div>
      <h1><T>Welcome to the Prison Management System</T></h1>
      <p><T>This text will be automatically translated</T></p>
    </div>
  );
}
```

For dynamic text that needs translation:

```jsx
import TranslatedText from '../components/common/TranslatedText';

function MyComponent({ name }) {
  return (
    <div>
      <TranslatedText text={`Hello, ${name}!`} />
    </div>
  );
}
```

To add a language selector:

```jsx
import LanguageSelector from '../components/common/LanguageSelector';

function MyComponent() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSelector />
    </header>
  );
}
```

### API Endpoints

The following API endpoints are available for translation:

- `POST /api/translate/text` - Translate a single text string
- `POST /api/translate/batch` - Translate multiple texts at once
- `POST /api/translate/object` - Translate all string values in an object

Authenticated versions of these endpoints are also available:
- `POST /api/translate/text/auth`
- `POST /api/translate/batch/auth`
- `POST /api/translate/object/auth`

## Troubleshooting

If translations are not working:

1. Check that you've set up the Azure Translator API key correctly in your `.env` file
2. Verify that the Azure Translator resource is active in your Azure portal
3. Check the browser console and server logs for any error messages
4. Make sure the language codes are correct (English = 'en', Amharic = 'am')

## Limitations

- The free tier of Azure Translator has a limit of 2 million characters per month
- Some complex sentences or specialized terminology may not translate perfectly
- Translation requests can add a slight delay to user interface rendering 