import { TLD_MAP } from '../utils/tld-map';

const PATTERN_MATCHING_URL = /^https?:\/\/(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+\.[^:\/\n]+).*/;

export const LunchMeatService = { 
    getServiceUrlName: (serviceName: string) => { 
        const extractedUrl = serviceName.match(PATTERN_MATCHING_URL);
        const [_, capturedUrl] = extractedUrl!; 
        return capturedUrl;
    },
    validateServiceUrl: (service: string): boolean => { 
        if (service == null || service == "") { 
            return false; 
        }

        const extractedUrl = service.match(PATTERN_MATCHING_URL);
        if (!extractedUrl || extractedUrl.length === 0) { 
            return false; 
        }

        // We then need to test some rules. 
        const [_, capturedUrl] = extractedUrl!; 
        const hasTld = capturedUrl && capturedUrl.split('.')
            .some(end => TLD_MAP[end] != null);

        return !!hasTld;
    }
}