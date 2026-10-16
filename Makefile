
TOPDIR=$(PWD)
ASSETS=$(TOPDIR)/assets

tinymce760:
	cd $(ASSETS) && \
	wget https://download.tiny.cloud/tinymce/community/tinymce_7.6.0.zip && unzip tinymce_7.6.0.zip && \
	mv tinymce tinymce_7.6.0 && rm tinymce_7.6.0.zip ; \

bootstrap533:
	cd $(ASSETS) && \
	wget https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip && unzip bootstrap-5.3.3-dist.zip && \
	mv bootstrap-5.3.3-dist bootstrap-5.3.3 && rm bootstrap-5.3.3-dist.zip ; \

bicons1131:
	cd $(ASSETS) && \
	wget https://github.com/twbs/icons/releases/download/v1.13.1/bootstrap-icons-1.13.1.zip && unzip bootstrap-icons-1.13.1.zip && \
	rm bootstrap-icons-1.13.1.zip ; \

