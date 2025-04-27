"use client";

import { useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  IconButton, 
  Divider, 
  Link, 
  Badge
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";

interface Contact {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function InHouseSupport() {
  const [contacts] = useState<Contact[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@Paperflow.com",
      isActive: true
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@Paperflow.com",
      isActive: false
    }
  ]);

  return (
    <Box sx={{ mt: 8 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          In-house support
        </Typography>
        <IconButton 
          size="small"
          aria-label="Edit support contacts"
          sx={{ p: 1.5 }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            These contacts are available to provide company-wide support to your users.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {contacts.map(contact => (
              <Box 
                key={contact.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 2,
                  '&:not(:last-child)': {
                    borderBottom: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                <Badge
                  variant="dot"
                  color={contact.isActive ? "success" : "error"}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      right: 5, 
                      top: 5,
                      width: 8,
                      height: 8,
                      minWidth: 8,
                      borderRadius: '50%'
                    } 
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 2,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      fontWeight: 500,
                      fontSize: '0.875rem'
                    }}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </Box>
                </Badge>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {contact.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contact.email}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Link href="/contact" underline="hover" variant="body2" sx={{ color: 'primary.main' }}>
            Contact us
          </Link>
        </Box>
      </Card>
    </Box>
  );
} 