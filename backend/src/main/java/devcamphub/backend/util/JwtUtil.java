package devcamphub.backend.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders; // Added import
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret; // This should now be a base64 encoded string

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private SecretKey signingKey; // Store the generated/decoded key

    // Initialize the signing key once
    private SecretKey getSigningKey() {
        if (this.signingKey == null) {
            // Attempt to decode the secret from properties
            try {
                // HS512 requires a key of at least 512 bits (64 bytes)
                byte[] keyBytes = Decoders.BASE64.decode(secret);
                if (keyBytes.length < 64) {
                    // If provided secret is too short, generate a new secure one
                    this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
                    System.err.println("WARNING: Provided JWT secret is too short for HS512. Generating a new secure key.");
                } else {
                    this.signingKey = Keys.hmacShaKeyFor(keyBytes);
                }
            } catch (IllegalArgumentException e) {
                // If decoding fails (e.g., not a valid base64 string), generate a new secure one
                this.signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
                System.err.println("WARNING: Provided JWT secret is not a valid Base64 string. Generating a new secure key.");
            }
        }
        return this.signingKey;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // Assuming userDetails.getAuthorities() returns a collection of GrantedAuthority
        // and that the role is represented as a string in these authorities.
        // For simplicity, let's assume there's only one role or we take the first one.
        if (userDetails.getAuthorities() != null && !userDetails.getAuthorities().isEmpty()) {
            // Extract the role (e.g., "ROLE_ADMIN", "ROLE_STUDENT")
            String role = userDetails.getAuthorities().iterator().next().getAuthority();
            // Remove "ROLE_" prefix if present, to match frontend's "ADMIN", "STUDENT"
            if (role.startsWith("ROLE_")) {
                role = role.substring(5);
            }
            claims.put("role", role);
        }
        return createToken(claims, userDetails.getUsername(), accessTokenExpirationMs);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return createToken(new HashMap<>(), userDetails.getUsername(), refreshTokenExpirationMs);
    }

    private String createToken(Map<String, Object> claims, String subject, long expirationMs) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
