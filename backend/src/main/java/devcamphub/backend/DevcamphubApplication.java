package devcamphub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
@EnableJpaRepositories(basePackages = "devcamphub.backend.repository")
public class DevcamphubApplication {

	public static void main(String[] args) {
		SpringApplication.run(DevcamphubApplication.class, args);
	}

}
