# MenuGen

A full-stack web application inspired by Andrej Karpathy's MenuGen that allows users to upload photos of restaurant menus and generate beautiful AI images of each dish.

## Features

- 📸 **Menu Upload**: Drag-and-drop or click to upload menu photos
- 🔍 **OCR Processing**: Extract dish names from menu images using Tesseract.js
- 🎨 **AI Image Generation**: Generate realistic food photos using Replicate's SDXL model
- 📱 **Responsive Design**: Beautiful, mobile-friendly interface with Tailwind CSS
- 🌙 **Dark Mode**: Full dark mode support
- ⚡ **Real-time Processing**: Live updates with loading states and error handling

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **OCR**: Tesseract.js (client-side text recognition)
- **AI Images**: Replicate API (Stable Diffusion XL)
- **Backend**: Next.js API Routes
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Replicate API account and token

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd menugen-demo
   npm install
   ```

2. **Set up environment variables:**
   
   Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```
   
   Add your Replicate API token to `.env.local`:
   ```
   REPLICATE_API_TOKEN=r8_your_token_here
   ```
   
   Get your API token from: https://replicate.com/account/api-tokens

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a Menu**: Click the upload area or drag and drop a menu photo
2. **Wait for Processing**: The app will extract text from the image using OCR
3. **Review Extracted Dishes**: See the parsed dish names in the results
4. **Generate Images**: Click on individual dish cards to generate AI images
5. **View Results**: Enjoy the beautiful AI-generated food photos!

## API Endpoints

### POST `/api/genimg`

Generates an AI image for a given dish name.

**Request Body:**
```json
{
  "dishName": "Grilled Salmon with Herbs"
}
```

**Response:**
```json
{
  "imageUrl": "https://replicate.delivery/..."
}
```

## Project Structure

```
src/
├── app/
│   ├── api/genimg/route.ts    # Image generation API endpoint
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Main homepage component
│   └── globals.css            # Global styles
├── components/
│   └── DishCard.tsx           # Reusable dish card component
└── utils/
    ├── ocr.ts                 # OCR processing utilities
    └── genImage.ts            # Image generation utilities
```

## Configuration

### OCR Settings

The app uses Tesseract.js for client-side OCR. You can modify the OCR settings in `src/utils/ocr.ts`:

- Language: Default is English ('eng')
- Text filtering: Customizable dish name parsing rules
- Confidence threshold: Adjustable recognition confidence

### Image Generation

The app uses Replicate's Stable Diffusion XL model. You can customize the generation parameters in `src/app/api/genimg/route.ts`:

- Model: `stability-ai/sdxl`
- Resolution: 1024x1024
- Steps: 50
- Guidance Scale: 7.5

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `REPLICATE_API_TOKEN` to Vercel's environment variables
4. Deploy!

### Other Platforms

The app is a standard Next.js application and can be deployed to any platform that supports Node.js.

## Development

### Adding New Features

- **Authentication**: Add Clerk or NextAuth.js for user accounts
- **Database**: Use Supabase or PlanetScale for data persistence
- **Payment**: Integrate Stripe for usage-based billing
- **Export**: Add PDF export functionality
- **Enhanced OCR**: Upgrade to GPT-4 Vision for better text recognition

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPLICATE_API_TOKEN` | Yes | Your Replicate API token |
| `OPENAI_API_KEY` | No | Alternative to Replicate (not implemented) |

## Troubleshooting

### Common Issues

1. **OCR not working**: Ensure the uploaded image is clear and contains readable text
2. **Image generation fails**: Check that your Replicate API token is valid
3. **Slow processing**: Large images take longer to process; consider resizing
4. **No dishes found**: The OCR filter may be too strict; check `parseMenuText()` logic

### Performance Tips

- Resize large images before upload
- Use JPEG format for better compression
- Ensure good lighting and contrast in menu photos

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

- Inspired by [Andrej Karpathy's MenuGen](https://www.menugen.app)
- Built with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com)
- OCR powered by [Tesseract.js](https://tesseract.projectnaptha.com)
- AI images generated by [Replicate](https://replicate.com)
