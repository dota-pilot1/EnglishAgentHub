package com.cj.englishagenthub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EnglishAgentHubServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnglishAgentHubServerApplication.class, args);
	}

}
