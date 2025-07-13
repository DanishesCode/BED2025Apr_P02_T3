// Weather Model - Handles data fetching and business logic

class WeatherModel {
    constructor() {
        // Frontend model no longer needs API keys - handled by backend
        this.keysInitialized = true;
        
        // Curated location keywords for better image searches
        this.locationImageKeywords = {
            // Singapore specific keywords for better cityscape results - enhanced for Pexels API
            'Singapore': ['singapore marina bay skyline', 'singapore city center', 'singapore downtown'],
            'Marina Bay': ['singapore marina bay sands skyline', 'marina bay singapore night'],
            'Raffles Place': ['singapore raffles place financial district', 'singapore central business district'],
            'City Hall': ['singapore city hall civic district', 'singapore government buildings'],
            'Tanjong Pagar': ['singapore tanjong pagar financial towers', 'singapore business district skyscrapers'],
            'Orchard': ['singapore orchard road shopping district', 'orchard singapore shopping street'],
            'Newton': ['singapore newton district residential', 'singapore newton area buildings'],
            'Novena': ['singapore novena medical hub', 'singapore novena district skyline'],
            'Toa Payoh': ['singapore toa payoh hdb flats', 'singapore public housing estate'],
            'Bishan': ['singapore bishan park town', 'singapore bishan residential area'],
            'Changi': ['singapore changi airport area', 'singapore changi district'],
            'Pasir Ris': ['singapore pasir ris town center', 'singapore pasir ris residential area'],
            'Tampines': ['singapore tampines town hub', 'singapore tampines shopping center'],
            'Bedok': ['singapore bedok town residential', 'singapore bedok marketplace'],
            'Simei': ['singapore simei residential area', 'singapore eastern district'],
            'Tanah Merah': ['singapore tanah merah district', 'singapore east coast area'],
            'Woodlands': ['singapore woodlands causeway', 'singapore northern border town'],
            'Yishun': ['singapore yishun town center', 'singapore yishun residential'],
            'Sembawang': ['singapore sembawang town', 'singapore northern district'],
            'Ang Mo Kio': ['singapore ang mo kio town center', 'singapore ang mo kio hub'],
            'Hougang': ['singapore hougang residential area', 'singapore hougang mall'],
            'Punggol': ['singapore punggol waterway point', 'singapore punggol new town'],
            'Sengkang': ['singapore sengkang compass one', 'singapore sengkang town'],
            'Jurong': ['singapore jurong west town', 'singapore jurong industrial area'],
            'Jurong East': ['singapore jurong east hub', 'singapore jurong gateway'],
            'Jurong West': ['singapore jurong west town center', 'singapore jurong west residential'],
            'Clementi': ['singapore clementi town center', 'singapore clementi mall'],
            'Bukit Batok': ['singapore bukit batok town', 'singapore bukit batok residential'],
            'Bukit Panjang': ['singapore bukit panjang plaza', 'singapore bukit panjang town'],
            'Choa Chu Kang': ['singapore choa chu kang town', 'singapore choa chu kang residential'],
            'Tuas': ['singapore tuas industrial area', 'singapore tuas port'],
            'Sentosa': ['singapore sentosa island resort', 'sentosa universal studios singapore'],
            'HarbourFront': ['singapore harbourfront vivo city', 'singapore harbourfront area'],
            'Tiong Bahru': ['singapore tiong bahru heritage district', 'singapore tiong bahru market'],
            'Outram': ['singapore outram district', 'singapore central area'],
            'Little India': ['singapore little india district', 'singapore little india cultural area'],
            'Chinatown': ['singapore chinatown heritage district', 'singapore chinatown street'],
            'Kampong Glam': ['singapore kampong glam arab quarter', 'singapore sultan mosque area'],
            'Boat Quay': ['singapore boat quay riverside', 'singapore boat quay restaurants'],
            'Clarke Quay': ['singapore clarke quay nightlife', 'singapore clarke quay riverside'],
            'Bukit Timah': ['singapore bukit timah nature reserve', 'singapore bukit timah hill'],
            'MacRitchie': ['singapore macritchie reservoir', 'singapore macritchie nature'],
            'East Coast': ['singapore east coast park beach', 'singapore east coast seafront'],
            'West Coast': ['singapore west coast park', 'singapore west coast residential'],
            'Chinese Garden': ['singapore chinese garden jurong', 'singapore chinese garden pagoda'],
            
            // International locations for better results
            'Beijing': ['beijing skyline', 'beijing china', 'forbidden city beijing'],
            'Shanghai': ['shanghai skyline', 'shanghai china', 'shanghai bund'],
            'Hong Kong': ['hong kong skyline', 'hong kong city', 'victoria harbour'],
            'Tokyo': ['tokyo skyline', 'tokyo japan', 'shibuya tokyo'],
            'Osaka': ['osaka japan', 'osaka castle', 'osaka city'],
            'Seoul': ['seoul skyline', 'seoul south korea', 'gangnam seoul'],
            'Paris': ['paris france', 'eiffel tower paris', 'paris cityscape'],
            'London': ['london england', 'big ben london', 'london skyline'],
            'New York': ['new york skyline', 'manhattan new york', 'times square'],
            'Los Angeles': ['los angeles california', 'la skyline', 'hollywood los angeles'],
            'Sydney': ['sydney australia', 'sydney opera house', 'sydney harbour'],
            'Melbourne': ['melbourne australia', 'melbourne city', 'melbourne skyline'],
            'Mumbai': ['mumbai india', 'mumbai skyline', 'gateway of india'],
            'Delhi': ['delhi india', 'new delhi', 'india gate delhi'],
            'Bangkok': ['bangkok thailand', 'bangkok skyline', 'bangkok temples'],
            'Kuala Lumpur': ['kuala lumpur malaysia', 'petronas towers', 'kl skyline'],
            'Jakarta': ['jakarta indonesia', 'jakarta skyline', 'indonesia capital'],
            'Manila': ['manila philippines', 'manila skyline', 'makati manila'],
            'Dubai': ['dubai uae', 'burj khalifa dubai', 'dubai skyline'],
            'Istanbul': ['istanbul turkey', 'hagia sophia istanbul', 'bosphorus istanbul'],
            'Moscow': ['moscow russia', 'red square moscow', 'kremlin moscow'],
            'Berlin': ['berlin germany', 'brandenburg gate berlin', 'berlin skyline'],
            'Rome': ['rome italy', 'colosseum rome', 'vatican rome'],
            'Madrid': ['madrid spain', 'madrid skyline', 'royal palace madrid'],
            'Amsterdam': ['amsterdam netherlands', 'amsterdam canals', 'amsterdam city'],
            'Vienna': ['vienna austria', 'schonbrunn vienna', 'vienna architecture'],
            'Prague': ['prague czech republic', 'prague castle', 'charles bridge prague'],
            'Buenos Aires': ['buenos aires argentina', 'buenos aires skyline', 'tango buenos aires'],
            'São Paulo': ['sao paulo brazil', 'sao paulo skyline', 'brazil sao paulo'],
            'Rio de Janeiro': ['rio de janeiro brazil', 'christ redeemer rio', 'copacabana rio'],
            'Mexico City': ['mexico city mexico', 'zocalo mexico city', 'mexico df'],
            'Toronto': ['toronto canada', 'cn tower toronto', 'toronto skyline'],
            'Vancouver': ['vancouver canada', 'vancouver mountains', 'stanley park vancouver'],
            'Montreal': ['montreal canada', 'old montreal', 'mont royal montreal']
        };
        
        // Fallback images (high quality stock images)
        this.fallbackImages = {
            // Singapore locations - All using Marina Bay skyline to ensure consistency and Singapore relevance
            'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Marina Bay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Raffles Place': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'City Hall': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Tanjong Pagar': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Orchard': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Newton': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Novena': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Sentosa': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Chinatown': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Little India': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Jurong': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Jurong East': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Jurong West': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Clementi': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Bukit Batok': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Bukit Panjang': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Choa Chu Kang': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Tuas': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Tampines': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Bedok': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Pasir Ris': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Changi': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Simei': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Tanah Merah': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Woodlands': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Yishun': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Sembawang': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Ang Mo Kio': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Hougang': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Punggol': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Sengkang': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Toa Payoh': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Bishan': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Tiong Bahru': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Outram': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Kampong Glam': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Boat Quay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Clarke Quay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'HarbourFront': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Bukit Timah': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'MacRitchie': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'East Coast': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'West Coast': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            'Chinese Garden': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&h=1080&fit=crop&crop=center',
            
            // Asia - East Asia
            'China': 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920&h=1080&fit=crop&crop=center',
            'Beijing': 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1920&h=1080&fit=crop&crop=center',
            'Shanghai': 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=1920&h=1080&fit=crop&crop=center',
            'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1920&h=1080&fit=crop&crop=center',
            'Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop&crop=center',
            'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop&crop=center',
            'Osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1920&h=1080&fit=crop&crop=center',
            'Kyoto': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1920&h=1080&fit=crop&crop=center',
            'South Korea': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&h=1080&fit=crop&crop=center',
            'Seoul': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1920&h=1080&fit=crop&crop=center',
            'Busan': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            'Taiwan': 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e3?w=1920&h=1080&fit=crop&crop=center',
            'Taipei': 'https://images.unsplash.com/photo-1562602833-0f4ab2fc46e3?w=1920&h=1080&fit=crop&crop=center',
            
            // Asia - Southeast Asia
            'Malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&h=1080&fit=crop&crop=center',
            'Kuala Lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&h=1080&fit=crop&crop=center',
            'Thailand': 'https://images.unsplash.com/photo-1563492065-58d25e930c1b?w=1920&h=1080&fit=crop&crop=center',
            'Bangkok': 'https://images.unsplash.com/photo-1563492065-58d25e930c1b?w=1920&h=1080&fit=crop&crop=center',
            'Indonesia': 'https://images.unsplash.com/photo-1555400082-b2fb2d8f2226?w=1920&h=1080&fit=crop&crop=center',
            'Jakarta': 'https://images.unsplash.com/photo-1555400082-b2fb2d8f2226?w=1920&h=1080&fit=crop&crop=center',
            'Philippines': 'https://images.unsplash.com/photo-1551782899-5f5bcb25b6c7?w=1920&h=1080&fit=crop&crop=center',
            'Manila': 'https://images.unsplash.com/photo-1551782899-5f5bcb25b6c7?w=1920&h=1080&fit=crop&crop=center',
            'Vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&h=1080&fit=crop&crop=center',
            'Ho Chi Minh City': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&h=1080&fit=crop&crop=center',
            'Hanoi': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            
            // Asia - South Asia
            'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&h=1080&fit=crop&crop=center',
            'Mumbai': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&h=1080&fit=crop&crop=center',
            'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1920&h=1080&fit=crop&crop=center',
            'New Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1920&h=1080&fit=crop&crop=center',
            'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163c4ffb81?w=1920&h=1080&fit=crop&crop=center',
            'Kolkata': 'https://images.unsplash.com/photo-1558431382-27a4e881c5c0?w=1920&h=1080&fit=crop&crop=center',
            'Pakistan': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?w=1920&h=1080&fit=crop&crop=center',
            'Karachi': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?w=1920&h=1080&fit=crop&crop=center',
            'Bangladesh': 'https://images.unsplash.com/photo-1549196166-f64aca430d70?w=1920&h=1080&fit=crop&crop=center',
            'Dhaka': 'https://images.unsplash.com/photo-1549196166-f64aca430d70?w=1920&h=1080&fit=crop&crop=center',
            
            // Europe - Western Europe
            'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&h=1080&fit=crop&crop=center',
            'UK': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&h=1080&fit=crop&crop=center',
            'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&h=1080&fit=crop&crop=center',
            'Manchester': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1920&h=1080&fit=crop&crop=center',
            'Edinburgh': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1920&h=1080&fit=crop&crop=center',
            'France': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1920&h=1080&fit=crop&crop=center',
            'Paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1920&h=1080&fit=crop&crop=center',
            'Lyon': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1920&h=1080&fit=crop&crop=center',
            'Marseille': 'https://images.unsplash.com/photo-1566846304256-0a3506a19fdc?w=1920&h=1080&fit=crop&crop=center',
            'Germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&h=1080&fit=crop&crop=center',
            'Berlin': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920&h=1080&fit=crop&crop=center',
            'Munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1920&h=1080&fit=crop&crop=center',
            'Hamburg': 'https://images.unsplash.com/photo-1544550285-4f72de5cb74d?w=1920&h=1080&fit=crop&crop=center',
            'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1920&h=1080&fit=crop&crop=center',
            'Rome': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1920&h=1080&fit=crop&crop=center',
            'Milan': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1920&h=1080&fit=crop&crop=center',
            'Florence': 'https://images.unsplash.com/photo-1543429176-2a8dac9c0e84?w=1920&h=1080&fit=crop&crop=center',
            'Venice': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1920&h=1080&fit=crop&crop=center',
            'Spain': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&h=1080&fit=crop&crop=center',
            'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920&h=1080&fit=crop&crop=center',
            'Barcelona': 'https://images.unsplash.com/photo-1564221710304-0b37c8b9d729?w=1920&h=1080&fit=crop&crop=center',
            'Netherlands': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1920&h=1080&fit=crop&crop=center',
            'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1920&h=1080&fit=crop&crop=center',
            'Switzerland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Zurich': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Austria': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1920&h=1080&fit=crop&crop=center',
            'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1920&h=1080&fit=crop&crop=center',
            
            // Europe - Northern Europe
            'Sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1920&h=1080&fit=crop&crop=center',
            'Stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1920&h=1080&fit=crop&crop=center',
            'Norway': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Oslo': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            'Denmark': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1920&h=1080&fit=crop&crop=center',
            'Copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1920&h=1080&fit=crop&crop=center',
            'Finland': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            'Helsinki': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            
            // Europe - Eastern Europe
            'Russia': 'https://images.unsplash.com/photo-1520637836862-4d197d17c467?w=1920&h=1080&fit=crop&crop=center',
            'Moscow': 'https://images.unsplash.com/photo-1520637836862-4d197d17c467?w=1920&h=1080&fit=crop&crop=center',
            'St Petersburg': 'https://images.unsplash.com/photo-1583004355154-c0d65b0e0308?w=1920&h=1080&fit=crop&crop=center',
            'Poland': 'https://images.unsplash.com/photo-1580500550469-65b0e6f2d9b2?w=1920&h=1080&fit=crop&crop=center',
            'Warsaw': 'https://images.unsplash.com/photo-1580500550469-65b0e6f2d9b2?w=1920&h=1080&fit=crop&crop=center',
            'Czech Republic': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&h=1080&fit=crop&crop=center',
            'Prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&h=1080&fit=crop&crop=center',
            'Hungary': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&h=1080&fit=crop&crop=center',
            'Budapest': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&h=1080&fit=crop&crop=center',
            
            // North America
            'United States': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop&crop=center',
            'USA': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop&crop=center',
            'New York': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop&crop=center',
            'Los Angeles': 'https://images.unsplash.com/photo-1544913974-5432ca8cd5c9?w=1920&h=1080&fit=crop&crop=center',
            'Chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop&crop=center',
            'San Francisco': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Miami': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Las Vegas': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Canada': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1920&h=1080&fit=crop&crop=center',
            'Toronto': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1920&h=1080&fit=crop&crop=center',
            'Vancouver': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Montreal': 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1920&h=1080&fit=crop&crop=center',
            'Mexico': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1920&h=1080&fit=crop&crop=center',
            'Mexico City': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1920&h=1080&fit=crop&crop=center',
            
            // South America
            'Brazil': 'https://images.unsplash.com/photo-1544550285-4f72de5cb74d?w=1920&h=1080&fit=crop&crop=center',
            'São Paulo': 'https://images.unsplash.com/photo-1544550285-4f72de5cb74d?w=1920&h=1080&fit=crop&crop=center',
            'Rio de Janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&h=1080&fit=crop&crop=center',
            'Argentina': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1920&h=1080&fit=crop&crop=center',
            'Buenos Aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1920&h=1080&fit=crop&crop=center',
            'Chile': 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=1920&h=1080&fit=crop&crop=center',
            'Santiago': 'https://images.unsplash.com/photo-1570829460005-c840387bb1ca?w=1920&h=1080&fit=crop&crop=center',
            'Colombia': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1920&h=1080&fit=crop&crop=center',
            'Bogotá': 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1920&h=1080&fit=crop&crop=center',
            
            // Middle East
            'UAE': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&h=1080&fit=crop&crop=center',
            'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&h=1080&fit=crop&crop=center',
            'Abu Dhabi': 'https://images.unsplash.com/photo-1585856809628-43ac8c38bbaf?w=1920&h=1080&fit=crop&crop=center',
            'Saudi Arabia': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            'Riyadh': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&crop=center',
            'Turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1920&h=1080&fit=crop&crop=center',
            'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1920&h=1080&fit=crop&crop=center',
            'Israel': 'https://images.unsplash.com/photo-1544973503-1edc79ad3967?w=1920&h=1080&fit=crop&crop=center',
            'Tel Aviv': 'https://images.unsplash.com/photo-1544973503-1edc79ad3967?w=1920&h=1080&fit=crop&crop=center',
            
            // Africa
            'South Africa': 'https://images.unsplash.com/photo-1484318571209-661cf29a69ea?w=1920&h=1080&fit=crop&crop=center',
            'Cape Town': 'https://images.unsplash.com/photo-1484318571209-661cf29a69ea?w=1920&h=1080&fit=crop&crop=center',
            'Johannesburg': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=1920&h=1080&fit=crop&crop=center',
            'Egypt': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?w=1920&h=1080&fit=crop&crop=center',
            'Cairo': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73d0e?w=1920&h=1080&fit=crop&crop=center',
            'Morocco': 'https://images.unsplash.com/photo-1486116736668-0bac976e6d40?w=1920&h=1080&fit=crop&crop=center',
            'Casablanca': 'https://images.unsplash.com/photo-1486116736668-0bac976e6d40?w=1920&h=1080&fit=crop&crop=center',
            'Nigeria': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=1920&h=1080&fit=crop&crop=center',
            'Lagos': 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=1920&h=1080&fit=crop&crop=center',
            
            // Oceania
            'Australia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Melbourne': 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1920&h=1080&fit=crop&crop=center',
            'Brisbane': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Perth': 'https://images.unsplash.com/photo-1606219938442-530333b323b4?w=1920&h=1080&fit=crop&crop=center',
            'New Zealand': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            'Auckland': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center',
            
            'default': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center'
        };
    }

    /**
     * @deprecated 
     */
    async initializeApiKeys() {
      // API keys are now handled by the backend
        this.keysInitialized = true;
        console.log('✅ Weather API configured (backend mode)');
    }

    /**
     * @deprecated 
     */
    async ensureApiKeysInitialized() {
        return true;
    }

    /**
     * @deprecated 
     * @returns {boolean} 
     */
    validateApiKey() {
        return true;
    }

    /**
     * @param {string} location - Location to get weather for
     * @returns {Promise<Object>} Weather data object
     */
    async fetchWeatherData(location) {
        // Determine the correct API URL based on environment
        const isLiveServer = window.location.port === '5500' || window.location.hostname === '127.0.0.1';
        const baseUrl = isLiveServer ? 'http://localhost:3000' : '';
        const url = `${baseUrl}/api/weather?location=${encodeURIComponent(location)}`;
        
        try {
            console.log('🌤️ Fetching weather data for:', location);
            console.log('🔗 Request URL:', url);
            console.log('🌐 Environment:', isLiveServer ? 'Live Server (5500)' : 'Express Server (3000)');
            
            const response = await fetch(url);
            console.log('📡 Response status:', response.status, response.statusText);
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ Received non-JSON response:', {
                    status: response.status,
                    contentType,
                    content: text.substring(0, 200)
                });
                throw new Error(`Server returned HTML instead of JSON. Content: ${text.substring(0, 100)}...`);
            }
            
            const result = await response.json();
            console.log('📦 Response data:', result);
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP ${response.status}: Failed to fetch weather data`);
            }
            
            const data = result.data;
            
            // Get hourly forecast for next 10 hours (from first 2 days)
            const hourlyForecast = this.extractHourlyForecast(data.forecast.slice(0, 2));
            
            console.log('✅ Weather data fetched successfully');
            
            return {
                success: true,
                data: {
                    location: {
                        name: data.location.name,
                        country: data.location.country
                    },
                    current: {
                        temp_c: Math.round(data.current.temp_c),
                        condition: data.current.condition.text,
                        emoji: this.getWeatherEmoji(data.current.condition.text),
                        backgroundEmoji: this.getBackgroundWeatherEmoji(data.current.condition.text),
                        humidity: data.current.humidity,
                        feelslike_c: Math.round(data.current.feelslike_c),
                        uv: data.current.uv,
                        vis_km: data.current.vis_km
                    },
                    forecast: data.forecast.map(day => ({
                        date: day.date,
                        day: {
                            maxtemp_c: Math.round(day.day.maxtemp_c),
                            mintemp_c: Math.round(day.day.mintemp_c),
                            condition: day.day.condition.text,
                            emoji: this.getWeatherEmoji(day.day.condition.text),
                            icon: day.day.condition.icon
                        }
                    })),
                    hourly: hourlyForecast
                }
            };
        } catch (error) {
            console.error('❌ Weather API Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ... rest of your existing methods remain the same ...
    
    /**
     * Get location image using Pexels API for relevant photos
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Promise<string>} Image URL
     */
    async getLocationImage(locationName, countryName) {
        try {
            console.log(`🖼️ Getting image for: ${locationName}, ${countryName}`);
            
            // For Singapore, ONLY use Marina Bay skyline - NO Pexels API, NO random images
            if (countryName === 'Singapore') {
                console.log(`🇸🇬 Singapore detected - using ONLY Marina Bay skyline for ALL Singapore locations`);
                console.log(`� Location searched: "${locationName}"`);
                console.log(`📸 Using consistent Marina Bay image: ${this.fallbackImages['Singapore']}`);
                
                // ALWAYS return Marina Bay skyline for ANY Singapore location
                // This ensures consistency and prevents random international images
                return this.fallbackImages['Singapore'];
            }
            
            // For international locations, check specific fallback first
            if (this.fallbackImages[locationName]) {
                console.log(`📸 Using specific fallback for ${locationName}`);
                const isValid = await this.testImageUrl(this.fallbackImages[locationName]);
                if (isValid) {
                    return this.fallbackImages[locationName];
                }
            }
            
            // Check for country fallback
            if (this.fallbackImages[countryName]) {
                console.log(`📸 Using country fallback for ${countryName}`);
                const isValid = await this.testImageUrl(this.fallbackImages[countryName]);
                if (isValid) {
                    return this.fallbackImages[countryName];
                }
            }
            
            // Try to fetch from Pexels API for international locations only
            const pexelsImage = await this.fetchFromPexels(locationName, countryName);
            if (pexelsImage) {
                return pexelsImage;
            }
            
            // Try partial matching for fallback images
            const locationLower = locationName.toLowerCase();
            const countryLower = countryName.toLowerCase();
            
            for (const [key, imageUrl] of Object.entries(this.fallbackImages)) {
                const keyLower = key.toLowerCase();
                if (keyLower.includes(locationLower) || 
                    keyLower.includes(countryLower) ||
                    locationLower.includes(keyLower) ||
                    countryLower.includes(keyLower)) {
                    console.log(`📸 Using partial match fallback: ${key}`);
                    const isValid = await this.testImageUrl(imageUrl);
                    if (isValid) {
                        return imageUrl;
                    }
                }
            }
            
            // Default fallback
            console.log(`🏙️ Using default fallback image`);
            return this.fallbackImages.default;
            
        } catch (error) {
            console.error("❌ Error getting location image:", error);
            return this.fallbackImages.default;
        }
    }

    /**
     * Fetch relevant image from Pexels API
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Promise<string|null>} Image URL or null if failed
     */
    async fetchFromPexels(locationName, countryName) {
        // Ensure API keys are initialized
        
        // Check if Pexels API key is available
        if (!this.pexelsApiKey || this.pexelsApiKey === 'No API Key Yet') {
            console.warn('Pexels API key not configured, using fallback');
            return null;
        }

        try {
            // Get search keywords for this location
            const keywords = this.getLocationKeywords(locationName, countryName);
            
            for (const keyword of keywords) {
                console.log(`🔍 Searching Pexels for: ${keyword}`);
                
                const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=15&orientation=landscape`, {
                    headers: {
                        'Authorization': this.pexelsApiKey
                    }
                });

                console.log(`📊 Pexels API Response Status: ${response.status} for "${keyword}"`);
                
                // Check rate limit headers
                const rateLimit = response.headers.get('X-Ratelimit-Limit');
                const rateRemaining = response.headers.get('X-Ratelimit-Remaining');
                const rateReset = response.headers.get('X-Ratelimit-Reset');
                
                if (rateLimit && rateRemaining) {
                    console.log(`📈 Pexels API Rate Limit: ${rateRemaining}/${rateLimit} remaining`);
                    if (rateReset) {
                        const resetTime = new Date(rateReset * 1000);
                        console.log(`⏰ Rate limit resets at: ${resetTime.toLocaleTimeString()}`);
                    }
                }
                
                if (response.status === 429) {
                    console.warn('Pexels API rate limit exceeded - switching to fallback images');
                    return null;
                }

                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.photos && data.photos.length > 0) {
                        // Filter for relevant cityscape/architecture images
                        const relevantPhotos = data.photos.filter(photo => {
                            const alt = (photo.alt || '').toLowerCase();
                            const keywordLower = keyword.toLowerCase();
                            
                            // Look for architecture, cityscape, skyline, buildings keywords
                            const relevantKeywords = ['city', 'skyline', 'building', 'architecture', 'downtown', 'urban', 'landmark', 'tower', 'bridge', 'street', 'plaza', 'square'];
                            const hasRelevantKeywords = relevantKeywords.some(word => alt.includes(word));
                            
                            // Avoid people, faces, portraits, food
                            const avoidKeywords = ['person', 'people', 'man', 'woman', 'face', 'portrait', 'human', 'food', 'drink', 'coffee', 'restaurant'];
                            const hasAvoidKeywords = avoidKeywords.some(word => alt.includes(word));
                            
                            // Check if alt text contains location name parts
                            const locationParts = keywordLower.split(' ');
                            const hasLocationName = locationParts.some(part => part.length > 2 && alt.includes(part));
                            
                            return (hasRelevantKeywords || hasLocationName) && !hasAvoidKeywords;
                        });
                        
                        // Use filtered photos if available, otherwise use first photo as fallback
                        const photosToTry = relevantPhotos.length > 0 ? relevantPhotos : data.photos.slice(0, 3);
                        
                        for (const photo of photosToTry) {
                            const imageUrl = photo.src.large2x || photo.src.large || photo.src.medium;
                            console.log(`✅ Testing Pexels image: ${imageUrl} (filtered: ${relevantPhotos.length > 0})`);
                            
                            // Test if image loads
                            const isValid = await this.testImageUrl(imageUrl);
                            if (isValid) {
                                return imageUrl;
                            }
                        }
                    }
                }
                
                // Small delay between requests to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`❌ No suitable Pexels images found for ${locationName}`);
            return null;
            
        } catch (error) {
            console.error('❌ Pexels API error:', error);
            return null;
        }
    }

    /**
     * Get search keywords for a location
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Array<string>} Array of search keywords
     */
    getLocationKeywords(locationName, countryName) {
        // Check for specific location keywords first
        if (this.locationImageKeywords[locationName]) {
            return this.locationImageKeywords[locationName];
        }
        
        // Check if country name has specific keywords
        if (this.locationImageKeywords[countryName]) {
            return this.locationImageKeywords[countryName];
        }
        
        // Country mappings for better international support
        const countryMappings = {
            'China': ['beijing', 'shanghai', 'chinese architecture'],
            'Japan': ['tokyo', 'japanese', 'japan skyline'],
            'United States': ['new york', 'american', 'usa cityscape'],
            'USA': ['new york', 'american', 'usa cityscape'],
            'United Kingdom': ['london', 'british', 'uk landmarks'],
            'UK': ['london', 'british', 'uk landmarks'],
            'France': ['paris', 'french', 'france architecture'],
            'Germany': ['berlin', 'german', 'germany cityscape'],
            'Italy': ['rome', 'italian', 'italy landmarks'],
            'Spain': ['madrid', 'spanish', 'spain architecture'],
            'Australia': ['sydney', 'australian', 'australia skyline'],
            'Canada': ['toronto', 'canadian', 'canada cityscape'],
            'Brazil': ['rio de janeiro', 'brazilian', 'brazil landmarks'],
            'India': ['mumbai', 'indian', 'india architecture']
        };
        
        // Generate keywords based on country
        let keywords = [];
        
        if (countryMappings[countryName]) {
            keywords = countryMappings[countryName].map(keyword => 
                keyword.includes(locationName.toLowerCase()) ? keyword : `${keyword} ${locationName}`
            );
        } else if (countryName === 'Singapore') {
            keywords.push(`${locationName} singapore`);
            keywords.push(`singapore ${locationName.toLowerCase()}`);
            keywords.push('singapore city');
            keywords.push('singapore skyline');
        } else {
            keywords.push(`${locationName} ${countryName}`);
            keywords.push(`${locationName} city`);
            keywords.push(`${countryName} landscape`);
            keywords.push(`${countryName} architecture`);
        }
        
        return keywords;
    }

    /**
     * Test if an image URL is accessible
     * @param {string} imageUrl - Image URL to test
     * @returns {Promise<boolean>} True if image loads successfully
     */
    async testImageUrl(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Image loaded successfully: ${imageUrl}`);
                resolve(true);
            };
            img.onerror = () => {
                console.warn(`❌ Image failed to load: ${imageUrl}`);
                resolve(false);
            };
            // Set timeout to avoid hanging
            setTimeout(() => {
                console.warn(`⏰ Image load timeout: ${imageUrl}`);
                resolve(false);
            }, 5000);
            img.src = imageUrl;
        });
    }

    // ... include all your other existing methods ...
    
    formatForecastDates(forecast) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return forecast.map((day, index) => {
            const forecastDate = new Date(day.date);
            let dayName = '';

            if (this.isSameDate(forecastDate, yesterday)) {
                dayName = 'Yesterday';
            } else if (this.isSameDate(forecastDate, today)) {
                dayName = 'Today';
            } else if (this.isSameDate(forecastDate, tomorrow)) {
                dayName = 'Tomorrow';
            } else {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                dayName = dayNames[forecastDate.getDay()];
            }

            return {
                ...day,
                dayName,
                formattedDate: forecastDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })
            };
        });
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    extractHourlyForecast(forecastDays) {
        const now = new Date();
        const currentHour = now.getHours();
        const hourlyForecast = [];
        
        // Get all hours from today and tomorrow
        const allHours = [];
        
        forecastDays.forEach(day => {
            if (day.hour) {
                day.hour.forEach(hour => {
                    const hourTime = new Date(hour.time);
                    allHours.push({
                        time: hour.time,
                        temp_c: Math.round(hour.temp_c),
                        condition: hour.condition.text,
                        emoji: this.getWeatherEmoji(hour.condition.text),
                        icon: hour.condition.icon,
                        humidity: hour.humidity,
                        chance_of_rain: hour.chance_of_rain,
                        hourTime: hourTime
                    });
                });
            }
        });
        
        // Filter to get next 10 hours starting from current hour
        const filteredHours = allHours.filter(hour => {
            return hour.hourTime >= now;
        }).slice(0, 10);
        
        return filteredHours.map(hour => ({
            ...hour,
            displayTime: this.formatHourTime(hour.hourTime),
            isNow: this.isCurrentHour(hour.hourTime, now)
        }));
    }

    formatHourTime(time) {
        const now = new Date();
        
        if (this.isCurrentHour(time, now)) {
            return 'Now';
        }
        
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
    }

    isCurrentHour(time, now) {
        return time.getHours() === now.getHours() && 
               time.getDate() === now.getDate();
    }

    getWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();
        
        // Sunny/Clear conditions
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return '☀️';
        }
        
        // Partly cloudy
        if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly sunny')) {
            return '⛅';
        }
        
        // Cloudy/Overcast
        if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
            return '☁️';
        }
        
        // Rain conditions
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
            if (conditionLower.includes('heavy') || conditionLower.includes('torrential')) {
                return '🌧️';
            }
            return '🌦️';
        }
        
        // Thunderstorm
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return '⛈️';
        }
        
        // Snow conditions
        if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
            return '❄️';
        }
        
        // Fog/Mist
        if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
            return '🌫️';
        }
        
        // Wind
        if (conditionLower.includes('wind')) {
            return '💨';
        }
        
        // Default for unknown conditions
        return '🌤️';
    }

    getBackgroundWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return '☀️🌞';
        }
        
        if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
            return '🌧️⛈️';
        }
        
        if (conditionLower.includes('snow')) {
            return '❄️🌨️';
        }
        
        if (conditionLower.includes('cloudy')) {
            return '☁️⛅';
        }
        
        return '🌤️🌈';
    }

    getElderlyActivities(weatherData) {
        const condition = weatherData.condition.toLowerCase();
        const temp = weatherData.temp_c;
        const humidity = weatherData.humidity;
        const uv = weatherData.uv;
        
        let activities = [];
        
        // Sunny and pleasant weather (15-25°C)
        if ((condition.includes('sunny') || condition.includes('clear')) && temp >= 15 && temp <= 25 && uv <= 6) {
            activities = [
                {
                    icon: '🚶‍♂️',
                    title: 'Morning Garden Walk',
                    description: 'Perfect weather for a gentle stroll in the garden or park. The moderate temperature and sunshine provide ideal conditions for light exercise.',
                    benefits: ['Vitamin D', 'Light Exercise', 'Fresh Air', 'Mental Wellness'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=250&fit=crop'
                },
                {
                    icon: '🌱',
                    title: 'Outdoor Gardening',
                    description: 'Great time to tend to plants, water flowers, or do light gardening work. The pleasant weather makes outdoor activities enjoyable.',
                    benefits: ['Physical Activity', 'Productivity', 'Nature Connection'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop'
                },
                {
                    icon: '🪑',
                    title: 'Porch Reading',
                    description: 'Sit comfortably outside with a good book or newspaper. The natural light is perfect for reading without strain.',
                    benefits: ['Relaxation', 'Mental Stimulation', 'Fresh Air'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop'
                }
            ];
        }
        // Hot weather (>25°C) or high UV
        else if (temp > 25 || uv > 6) {
            activities = [
                {
                    icon: '🏠',
                    title: 'Indoor Light Exercises',
                    description: 'Stay cool indoors with gentle stretching, yoga, or chair exercises. Avoid outdoor activities during peak heat hours.',
                    benefits: ['Stay Cool', 'Safe Exercise', 'Flexibility'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1506629905607-a5f4caac9b6f?w=400&h=250&fit=crop'
                },
                {
                    icon: '💧',
                    title: 'Hydration & Rest',
                    description: 'Focus on staying well-hydrated and taking frequent breaks in air-conditioned spaces. Drink water regularly.',
                    benefits: ['Prevent Dehydration', 'Temperature Regulation'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1550837368-6594235de85c?w=400&h=250&fit=crop'
                },
                {
                    icon: '🌅',
                    title: 'Early Morning Activities',
                    description: 'If going outside, plan activities for early morning (before 9 AM) when temperatures are cooler.',
                    benefits: ['Cooler Temperature', 'Safe Timing', 'Fresh Air'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop'
                }
            ];
        }
        // Cool weather (5-15°C)
        else if (temp >= 5 && temp < 15) {
            activities = [
                {
                    icon: '🧥',
                    title: 'Warm Indoor Activities',
                    description: 'Enjoy indoor hobbies like reading, knitting, or light stretching. Keep warm and comfortable inside.',
                    benefits: ['Stay Warm', 'Mental Stimulation', 'Comfort'],
                    type: 'safe'
                },
                {
                    icon: '☕',
                    title: 'Warm Beverages & Socializing',
                    description: 'Perfect weather for enjoying warm tea or coffee with friends and family. Stay cozy indoors.',
                    benefits: ['Social Connection', 'Warmth', 'Relaxation'],
                    type: 'safe'
                },
                {
                    icon: '🚶‍♀️',
                    title: 'Short Outdoor Walks',
                    description: 'If well-dressed, short walks can be refreshing. Ensure you have warm clothing and proper footwear.',
                    benefits: ['Fresh Air', 'Light Exercise', 'Vitamin D'],
                    type: 'safe'
                }
            ];
        }
        // Cold weather (<5°C)
        else if (temp < 5) {
            activities = [
                {
                    icon: '🏠',
                    title: 'Stay Indoors & Keep Warm',
                    description: 'Very cold weather requires staying warm indoors. Focus on indoor activities and maintaining body temperature.',
                    benefits: ['Safety', 'Warmth', 'Health Protection'],
                    type: 'warning'
                },
                {
                    icon: '🧘‍♀️',
                    title: 'Indoor Exercise & Stretching',
                    description: 'Gentle indoor exercises help maintain circulation and warmth. Chair exercises and stretching are ideal.',
                    benefits: ['Circulation', 'Flexibility', 'Warmth'],
                    type: 'safe'
                },
                {
                    icon: '📚',
                    title: 'Indoor Mental Activities',
                    description: 'Engage in reading, puzzles, or other mentally stimulating activities while staying warm and safe.',
                    benefits: ['Mental Stimulation', 'Safety', 'Comfort'],
                    type: 'safe'
                }
            ];
        }
        // Rainy or overcast weather
        else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('overcast') || condition.includes('cloudy')) {
            activities = [
                {
                    icon: '🏠',
                    title: 'Cozy Indoor Day',
                    description: 'Perfect weather for indoor activities. Stay dry and comfortable while enjoying indoor hobbies.',
                    benefits: ['Comfort', 'Safety', 'Relaxation'],
                    type: 'safe'
                },
                {
                    icon: '🎨',
                    title: 'Creative Indoor Activities',
                    description: 'Great time for arts and crafts, writing, or other creative pursuits. Let your imagination flow!',
                    benefits: ['Creativity', 'Mental Stimulation', 'Productivity'],
                    type: 'safe'
                },
                {
                    icon: '👥',
                    title: 'Social Indoor Time',
                    description: 'Ideal for video calls with family, indoor games, or hosting friends for tea and conversation.',
                    benefits: ['Social Connection', 'Mental Wellness', 'Joy'],
                    type: 'safe'
                }
            ];
        }
        // Default pleasant weather
        else {
            activities = [
                {
                    icon: '🌤️',
                    title: 'Enjoy the Pleasant Weather',
                    description: 'Nice weather for gentle outdoor activities or comfortable indoor pursuits. Choose what feels best for you.',
                    benefits: ['Flexibility', 'Comfort', 'Well-being'],
                    type: 'safe'
                },
                {
                    icon: '🚶‍♂️',
                    title: 'Light Outdoor Activity',
                    description: 'Moderate weather is perfect for a short walk, sitting outside, or light gardening activities.',
                    benefits: ['Fresh Air', 'Light Exercise', 'Nature Connection'],
                    type: 'safe'
                },
                {
                    icon: '🧘‍♀️',
                    title: 'Relaxation & Wellness',
                    description: 'Take time for relaxation, meditation, or gentle stretching. Focus on your physical and mental well-being.',
                    benefits: ['Mental Wellness', 'Relaxation', 'Health'],
                    type: 'safe'
                }
            ];
        }
        
        return activities;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherModel;
}