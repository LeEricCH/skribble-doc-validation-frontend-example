"use client";

import React, { useState } from "react";
import TrialBanner from "@/components/ui/TrialBanner";
import { ContentCopyRounded, EditRounded } from "@mui/icons-material";
import { 
  Typography, 
  Box, 
  Card, 
  TextField,
  IconButton
} from "@mui/material";

export default function BusinessProfilePage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleCopyId = () => {
    navigator.clipboard.writeText("0513e34ade6538f09b3eb18028ea4373");
  };

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
            tesstt
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep your company details up to date.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: {xs: 'column-reverse', md: 'row'}, gap: 6 }}>
        <Box sx={{ width: {xs: '100%', md: '66.7%'} }}>
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="body2" color="text.secondary">
                ID: 0513e34ade6538f09b3eb18028ea4373
              </Typography>
              <IconButton size="small" onClick={handleCopyId} sx={{ ml: 2, p: 1.5 }}>
                <ContentCopyRounded sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 4 }}>Company details</Typography>
            <Card>
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  p: 3,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)' 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Name</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>tesstt</Typography>
                  </Box>
                  <IconButton size="small" sx={{ p: 1.5 }}>
                    <EditRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  p: 3 
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Phone number</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>1235566</Typography>
                  </Box>
                  <IconButton size="small" sx={{ p: 1.5 }}>
                    <EditRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Card>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 6 }}>
            <Typography variant="caption" color="text.secondary">
              Data hosting region: Switzerland
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v2.6.5
            </Typography>
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 4 }}>In-house support</Typography>
            <Card>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                p: 3,
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Contact</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>Add a support contact for your members</Typography>
                </Box>
                <IconButton size="small" sx={{ p: 1.5 }}>
                  <EditRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Instead of contacting Skribble, your members can contact your company&apos;s support directly. 
                  Contact details you provide are available to all signers in the &ldquo;Help&rdquo; section.
                </Typography>
                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box>
                    <Typography component="label" htmlFor="email" variant="body2" sx={{ fontWeight: 500, display: 'block', mb: 1 }}>
                      E-mail address
                    </Typography>
                    <TextField
                      fullWidth
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="small"
                      placeholder="Enter support email address"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      This could be your in-house first-level support.
                    </Typography>
                  </Box>
                  <Box>
                    <Typography component="label" htmlFor="phone" variant="body2" sx={{ fontWeight: 500, display: 'block', mb: 1 }}>
                      Phone number
                    </Typography>
                    <TextField
                      fullWidth
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      size="small"
                      placeholder="Enter support phone number"
                    />
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>

        <Box sx={{ width: {xs: '100%', md: '33.3%'}, mb: {xs: 6, md: 0} }}>
          <TrialBanner daysLeft={14} />
        </Box>
      </Box>
    </Box>
  );
} 