# Setup Instructions

## OpenAI API Key Configuration

To use the AI chatbot feature, you need to set up your OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

2. Create a `.env` file in the root directory of this project

3. Add the following line to the `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

4. Replace `your_actual_api_key_here` with your actual OpenAI API key

5. Make sure `.env` is in your `.gitignore` file (it should be already)

## Example .env file:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Notes:
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Restart the server after creating/updating the `.env` file

