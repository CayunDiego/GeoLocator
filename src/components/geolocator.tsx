
"use client";

import { useEffect, useState } from 'react';
import { MapPin, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Location = {
  city: string | null;
  country: string | null;
  source: 'ip' | 'browser' | null;
};

export function GeoLocator() {
  const [location, setLocation] = useState<Location>({ city: null, country: null, source: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Detecting your location...');

  const fetchLocationByIp = () => {
    setStatusMessage('Using IP address for location...');
    // A token can be added for higher request limits and better accuracy
    fetch('https://ipinfo.io/json?token=') 
      .then(response => {
        if (!response.ok) {
          throw new Error(`The location service responded with an error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.city && data.country) {
          setLocation({ city: data.city, country: data.country, source: 'ip' });
          setError(null);
        } else {
          throw new Error('Location data not found in the IP-based response.');
        }
      })
      .catch(err => {
        console.error('Error fetching location by IP:', err);
        setError(err.message || 'An unknown error occurred while fetching your location via IP.');
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      });
  };

  const fetchPreciseLocation = () => {
    if ('geolocation' in navigator) {
      setStatusMessage('Requesting location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStatusMessage('Fetching precise location...');
          // Using OpenStreetMap's free reverse geocoding service
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              const city = data.address.city || data.address.town || data.address.village;
              const country = data.address.country;
              if (city && country) {
                setLocation({ city, country, source: 'browser' });
                setError(null);
              } else {
                throw new Error('Could not determine city from coordinates.');
              }
            })
            .catch(() => {
              // If reverse geocoding fails, fall back to IP
              fetchLocationByIp();
            })
            .finally(() => {
              setLoading(false);
              setTimeout(() => setVisible(true), 50);
            });
        },
        (geoError) => {
          // User denied permission or another error occurred
          console.warn(`Geolocation error (${geoError.code}): ${geoError.message}`);
          fetchLocationByIp(); // Fallback to IP-based location
        }
      );
    } else {
      // Geolocation not supported by the browser
      fetchLocationByIp();
    }
  };

  useEffect(() => {
    fetchPreciseLocation();
  }, []);

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-background font-body">
      <Card className={`w-full max-w-md text-center shadow-2xl transition-opacity duration-1000 ease-in-out border ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <CardHeader className="pt-8">
          <CardTitle className="flex justify-center items-center gap-2 text-3xl font-headline text-primary">
            <Globe className="h-8 w-8" />
            GeoLocator
          </CardTitle>
          <CardDescription className="pt-2">Your city, based on your browser or IP address.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 min-h-[280px] flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">{statusMessage}</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center space-y-4 text-destructive">
              <AlertCircle className="h-12 w-12" />
              <p className="font-semibold text-lg">Location Unavailable</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {!loading && !error && location.city && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <MapPin className="h-16 w-16 text-accent" />
              <p className="text-lg text-muted-foreground">You are browsing from</p>
              <h2 className="text-5xl font-bold tracking-tight text-primary">{location.city}</h2>
              {location.country && <p className="text-md text-muted-foreground">{location.country}</p>}
              {location.source && <p className="text-xs text-muted-foreground/70 pt-4">(Source: {location.source === 'browser' ? 'Browser Geolocation' : 'IP Address'})</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
