# Paperflow Document Validator

Paperflow is a Next.js application that provides document validation services using the Skribble Validator API. The application allows users to upload and validate digital signatures in PDF documents, verify their authenticity, and download validation certificates.

![readme_image](https://github.com/user-attachments/assets/2836cef9-2649-4af8-b5f6-5d642515a26d)

## Features

- Document validation for digital signatures
- Validation certificate generation (PDF/PNG)
- Signature verification across multiple regulatory frameworks (EU, Switzerland)
- Signature quality checking (SES, AES, QES)
- Validation history tracking
- Configurable validation settings
- Multi-language support (English, German, French)
- Authentication via Keycloak

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- NPM 9.x or higher
- Skribble API credentials (username and API key)
- Keycloak server for authentication (for authentication features)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Skribble API Credentials
SKRIBBLE_USERNAME=your_skribble_username
SKRIBBLE_API_KEY=your_skribble_api_key

# Keycloak Authentication (if using authentication)
NEXT_PUBLIC_KEYCLOAK_URL=http://your-keycloak-server-url/auth
NEXT_PUBLIC_KEYCLOAK_REALM=your-realm-name
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=skribble-doc-validation-client
```

See here how to obtain the Skribble credentials: [Skribble Docs](https://docs.skribble.com/business-admin/api/apicreate.html).

### Live Demo
You can view a live demo of Paperflow at: [paperflow.ch](https://paperflow.ch).

### Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Run the development server
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication Setup

Paperflow supports authentication using Keycloak. To set up authentication:

1. **Configure a Keycloak Server**:
   - Set up a Keycloak server and create a new realm
   - Create a new client in the realm with the following settings:
     - Client ID: `skribble-doc-validation-client` (or your preferred ID)
     - Client Protocol: `openid-connect`
     - Access Type: `public`
     - Valid Redirect URIs: `http://localhost:3000/*` (and your production URLs)
     - Web Origins: `+` (or specify your domains)

2. **Configure Environment Variables**:
   - Add the Keycloak environment variables to your `.env.local` file as shown above

3. **User Management**:
   - Create users in your Keycloak realm or configure identity providers for social login

The application includes a "Log in with Skribble" button that authenticates users via the configured Keycloak instance.

## API Integration

This application uses the Skribble Document Validation API to verify digital signatures. The API client handles:

- Authentication with Skribble services
- Document upload and validation
- Retrieval of signer information
- Validation against various legal frameworks
- Certificate generation

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for server-side rendering
- [React](https://reactjs.org/) - UI library
- [Mantine](https://mantine.dev/) & [Material UI](https://mui.com/) - Component libraries
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [React-PDF](https://react-pdf.org/) - PDF generation for certificates
- [Keycloak-js](https://www.keycloak.org/docs/latest/securing_apps/) - Authentication

## Deployment

This application can be deployed to any hosting service that supports Next.js applications.

```bash
npm run build
npm run start
```

## Configuration Options

The validator supports various options that can be configured through the UI:

- **Signature Quality**: Minimum signature quality (SES, AES, QES)
- **Legislation**: Regulatory framework compliance (Global, EU, Switzerland)
- **Long-Term Validation**: Toggle for long-term validity checks
- **Visual Differences**: Reject documents with visual differences
- **Undefined Changes**: Reject documents with undefined changes

## License

This project is proprietary software.

## Support

For issues with the Skribble API integration, please contact Skribble support or visit their [documentation](https://docs.skribble.com/).
