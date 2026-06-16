// OCR Service - Extract meter readings from photos using Claude Vision API

export const extractMeterReading = async (imageFile) => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    // Call Claude API with vision capability
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `This is a photo of a utility meter (electricity, gas, or water). 
                
Please extract ONLY the meter reading value displayed on the meter. 
- For digital displays: return the numeric value shown (e.g., 12345.67)
- For dial meters: read the needles and return the numeric value
- Ignore units, decimal places beyond what's shown, and any other text

Respond with ONLY the number. If you cannot read the meter, respond with: UNABLE_TO_READ

Example responses:
12345.67
9876
UNABLE_TO_READ`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      return {
        success: false,
        reading: null,
        extractedByOCR: false,
        error: `API Error: ${errorData.error?.message || 'Unknown error'}`
      };
    }

    const data = await response.json();
    const responseText = data.content[0]?.text?.trim() || '';

    // Parse the response
    if (responseText === 'UNABLE_TO_READ') {
      return {
        success: false,
        reading: null,
        extractedByOCR: false,
        error: 'Unable to read meter. Please check image clarity or enter reading manually.'
      };
    }

    // Try to parse as number
    const reading = parseFloat(responseText);
    if (isNaN(reading)) {
      return {
        success: false,
        reading: null,
        extractedByOCR: false,
        error: `Could not parse meter reading: "${responseText}". Please enter manually.`
      };
    }

    return {
      success: true,
      reading: reading,
      extractedByOCR: true,
      error: null
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      success: false,
      reading: null,
      extractedByOCR: false,
      error: error.message
    };
  }
};

// Helper: Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Extract base64 part after the comma
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
