package devcamphub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class DevcamphubApplication {

	public static void main(String[] args) {
		SpringApplication.run(DevcamphubApplication.class, args);
	}

}
