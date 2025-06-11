# Crypto Liquidation Calculator

A modern, responsive cryptocurrency liquidation calculator built with Next.js 14.

## 🚀 Features

- **Multi-cryptocurrency support**: Bitcoin, Ethereum, BNB, Cardano, Solana
- **Real-time price data**: Live market data from Binance API
- **Advanced calculations**: Liquidation price, risk analysis, position sizing
- **Interactive charts**: Price visualization with liquidation levels
- **Responsive design**: Works perfectly on all devices
- **Dark/Light themes**: System-aware theme switching
- **Risk management**: Comprehensive risk analysis tools

## 📦 Installation

1. **Extract the project** from the ZIP file
2. **Open in VSCode** or your preferred editor
3. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

4. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - The API key is already configured for you

5. **Start the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Recharts** - Data visualization library
- **Radix UI** - Accessible component primitives

## 📱 Usage

1. **Select a cryptocurrency** from the dropdown
2. **Choose position type** (Long or Short)
3. **Toggle live price** for real-time data
4. **Enter your parameters**:
   - Entry price (or use live price)
   - Leverage (1x to 125x)
   - Position size in USD
5. **Click Calculate** to see results
6. **View comprehensive analysis** including:
   - Liquidation price
   - Risk assessment
   - Position summary
   - Interactive price chart

## 🔧 Configuration

The project uses environment variables for API configuration:

\`\`\`env
NEXT_PUBLIC_API_KEY=YeUUjgxip9y2xMk4TzpjtA==dFappnBIvgpFf7Ey
\`\`\`

## 📊 API Data Sources

- **Binance API**: Real-time cryptocurrency prices
- **Free tier**: No authentication required for basic price data

## 🎨 Customization

The project uses Tailwind CSS for styling. You can customize:

- **Colors**: Edit CSS variables in `app/globals.css`
- **Components**: Modify components in the `components/` directory
- **Themes**: Adjust theme settings in `components/theme-provider.tsx`

## 🚀 Deployment

Deploy easily on Vercel:

1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ by [Eskandar Atrakchi](https://github.com/EskandarAtrakchi)
\`\`\`

Let me also update the package.json to ensure all dependencies are correct:
