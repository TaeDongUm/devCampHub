package devcamphub.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get("uploads", "thumbnails");
        String resourceLocation = uploadPath.toFile().toURI().toString();
        registry.addResourceHandler("/thumbnails/**").addResourceLocations(resourceLocation);
    }
}
