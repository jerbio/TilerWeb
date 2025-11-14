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
  private readonly DEFAULT_LOCATION = "Empire State Building, New York, NY";
  
  // Cache for the current location data
  private currentLocationData: LocationData | null = null;

  // Cache for the locally set manual location
  private cachedManualLocation: LocationData | null = null;

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
   * Set a manually entered location (persists until cleared)
   */
  setManualLocation(location: LocationData): void {
    this.cachedManualLocation = location;
  }

  /**
   * Clear the manually entered location
   */
  clearManualLocation(): void {
    this.cachedManualLocation = null;
  }

  /**
   * Check if a manual location is set
   */
  hasManualLocation(): boolean {
    return this.cachedManualLocation !== null;
  }

  /**
   * Set the current location data (used when user manually enters an address)
   */
  setCurrentLocation(locationData: LocationData): void {
    this.currentLocationData = locationData;
  }

  /**
   * Get the user's current location
   * Returns cached location if available, otherwise uses browser geolocation API
   */
  async getCurrentLocation(): Promise<LocationData> {
    // If we have a cached location (manually set or previously fetched), return it
    if (this.currentLocationData) {
      return this.currentLocationData;
    }

    return this.fetchBrowserLocation();
  }

  /**
   * Force refresh location from browser geolocation API (ignores cache)
   */
  async refreshLocationFromBrowser(): Promise<LocationData> {
    return this.fetchBrowserLocation();
  }

  /**
   * Fetch location from browser geolocation API
   */
  private async fetchBrowserLocation(): Promise<LocationData> {
    try {
      // Check if geolocation is supported by the browser
      if (!navigator.geolocation) {
        const defaultLocation = this.getDefaultLocation();
        this.currentLocationData = defaultLocation;
        return defaultLocation;
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

        const locationData = {
          location: address,
          longitude,
          latitude,
          verified: true,
        };
        
        this.currentLocationData = locationData;
        return locationData;
      } catch (err) {
        // If reverse geocoding fails, just use coordinates
        console.error('Reverse geocoding failed:', err);
        const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        const locationData = {
          location: coords,
          longitude,
          latitude,
          verified: true,
        };
        
        this.currentLocationData = locationData;
        return locationData;
      }
    } catch (err) {
      console.error('Geolocation error:', err);
      const defaultLocation = this.getDefaultLocation();
      this.currentLocationData = defaultLocation;
      return defaultLocation;
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
      console.error('Geocoding failed', err);
      return null;
    }
  }

  /**
   * Get location data from a custom address input
   */
  async getLocationFromAddress(address: string): Promise<LocationData> {
    // Check if the entered location is the default
    if (address.trim() === this.DEFAULT_LOCATION) {
      const defaultLocation = this.getDefaultLocation();
      this.currentLocationData = defaultLocation;
      return defaultLocation;
    }

    try {
      // Try to geocode the entered address to get coordinates
      const geocodedResult = await this.geocodeAddress(address.trim());

      if (geocodedResult) {
        const locationData = {
          location: geocodedResult.displayName,
          longitude: geocodedResult.longitude,
          latitude: geocodedResult.latitude,
          verified: true,
        };
        
        // Cache the location data
        this.currentLocationData = locationData;
        return locationData;
      } else {
        // If geocoding fails, just use the entered text
        const locationData = {
          location: address.trim(),
          verified: false,
        };
        
        this.currentLocationData = locationData;
        return locationData;
      }
    } catch (err) {
      console.error('Error processing address:', err);
      const locationData = {
        location: address.trim(),
        verified: false,
      };
      
      this.currentLocationData = locationData;
      return locationData;
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