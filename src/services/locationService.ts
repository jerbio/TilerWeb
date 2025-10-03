export interface LocationData {
  location: string;
  longitude?: number;
  latitude?: number;
  verified: boolean;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

class LocationService {
  // Default location: National Museum of African American History and Culture in DC
  private readonly DEFAULT_LOCATION = "National Museum of African American History and Culture, Washington, DC";

  /**
   * Get the default location data
   */
  getDefaultLocation(): LocationData {
    return {
      location: this.DEFAULT_LOCATION,
      verified: false,
    };
  }

  /**
   * Get the user's current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Check if geolocation is supported by the browser
      if (!navigator.geolocation) {
        return this.getDefaultLocation();
      }

      // Get the current position with a timeout
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const { latitude, longitude } = position.coords;

      try {
        // Use reverse geocoding to get a human-readable address
        const address = await this.reverseGeocode(latitude, longitude);

        return {
          location: address,
          longitude,
          latitude,
          verified: true,
        };
      } catch (err) {
        // If reverse geocoding fails, just use coordinates
        console.error('Reverse geocoding failed:', err);
        const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        return {
          location: coords,
          longitude,
          latitude,
          verified: true,
        };
      }
    } catch (err) {
      console.error('Geolocation error:', err);
      return this.getDefaultLocation();
    }
  }

  /**
   * Convert coordinates to human-readable address using reverse geocoding
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location information');
    }

    const data = await response.json();
    return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  /**
   * Convert address to coordinates using geocoding
   */
  async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name
        };
      }

      return null;
    } catch (err) {
      console.log('Geocoding failed', err);
      return null;
    }
  }

  /**
   * Get location data from a custom address input
   */
  async getLocationFromAddress(address: string): Promise<LocationData> {
    // Check if the entered location is the default
    if (address.trim() === this.DEFAULT_LOCATION) {
      return this.getDefaultLocation();
    }

    try {
      // Try to geocode the entered address to get coordinates
      const geocodedResult = await this.geocodeAddress(address.trim());

      if (geocodedResult) {
        return {
          location: geocodedResult.displayName,
          longitude: geocodedResult.longitude,
          latitude: geocodedResult.latitude,
          verified: true,
        };
      } else {
        // If geocoding fails, just use the entered text
        return {
          location: address.trim(),
          verified: false,
        };
      }
    } catch (err) {
      console.error('Error processing address:', err);
      return {
        location: address.trim(),
        verified: false,
      };
    }
  }

  /**
   * Convert LocationData to API-compatible format
   */
  toApiFormat(locationData: LocationData) {
    return {
      userLongitude: locationData.longitude?.toString() ?? '',
      userLatitude: locationData.latitude?.toString() ?? '',
      userLocationVerified: locationData.verified ? "true" : "false",
    };
  }
}

// Export a singleton instance
export const locationService = new LocationService();
export default locationService;