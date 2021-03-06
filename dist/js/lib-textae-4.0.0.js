//for module pattern with tail.js
(function(jQuery) {
    // utility functions
    var textAeUtil = {
        // ajax wrapper
        ajaxAccessor: function() {
            var isEmpty = function(str) {
                return !str || str === "";
            };
            return {
                getSync: function(url) {
                    if (isEmpty(url)) {
                        return;
                    }

                    var result = null;
                    $.ajax({
                        type: "GET",
                        url: url,
                        async: false
                    }).done(function(data) {
                        result = data;
                    });
                    return result;
                },

                getAsync: function(url, dataHandler, finishHandler) {
                    if (isEmpty(url)) {
                        return;
                    }

                    $.ajax({
                        type: "GET",
                        url: url,
                        cache: false
                    })
                        .done(function(data) {
                            if (dataHandler !== undefined) {
                                dataHandler(data);
                            }
                        })
                        .fail(function(res, textStatus, errorThrown) {
                            alert("connection failed.");
                        })
                        .always(function(data) {
                            if (finishHandler !== undefined) {
                                finishHandler();
                            }
                        });
                },

                post: function(url, data, successHandler, failHandler, finishHandler) {
                    if (isEmpty(url)) {
                        return;
                    }

                    $.ajax({
                        type: "post",
                        url: url,
                        contentType: "application/json",
                        data: {
                            annotations: data
                        }
                    })
                        .done(successHandler)
                        .fail(failHandler)
                        .always(finishHandler);
                }
            };
        }(),

        // Usage sample: textAeUtil.getUrlParameters(location.search). 
        getUrlParameters: function(urlQuery) {
            // Remove ? at top.
            var queryString = urlQuery ? String(urlQuery).replace(/^\?(.*)/, '$1') : '';

            // Convert to array if exists
            var querys = queryString.length > 0 ? queryString.split('&') : [];

            return querys
                .map(function(param) {
                    // Convert string "key=value" to object.
                    var vals = param.split('=');
                    return {
                        key: vals[0],
                        val: vals[1]
                    };
                }).reduce(function(a, b) {
                    // Convert [{key: 'abc', val: '123'},...] to { abc: 123 ,...}
                    // Set value true if val is not set.
                    a[b.key] = b.val ? b.val : true;
                    return a;
                }, {});
        },

        makeInformationModal: function() {
            //this is bound object.
            var showModal = function(className, obj) {
                var getModal = function() {
                    var $modal = $('.' + this.className);
                    // add modal unless exists
                    if ($modal.length === 0) {
                        $modal = $('<div>')
                            .addClass('textae__information-modal')
                            .addClass(this.className)
                            .hide();
                        this.addContentsFunc.call($modal);
                        $('body').append($modal);
                    }
                    return $modal;
                };

                var setPositionCenter = function($modal) {
                    var $window = $(window);
                    $modal.css({
                        'position': 'absolute',
                        'top': ($window.height() - $modal.height()) / 2 + $window.scrollTop(),
                        'left': ($window.width() - $modal.width()) / 2 + $window.scrollLeft()
                    });
                };

                //close other dialogs
                $('.textae__information-modal').hide();

                //show at center
                var $modal = getModal.call(this);
                setPositionCenter($modal);
                $modal.show();
            };

            //this is bound object.
            var hideModal = function(className) {
                $('.' + this.className).hide();
            };

            //expected param has className and addContentsFunc.
            var bindObject = function(param) {
                return {
                    show: showModal.bind(param),
                    hide: hideModal.bind(param)
                };
            };

            //close modal when modal clicked.
            $(function() {
                $('body').on('mouseup', '.textae__information-modal', function() {
                    $(this).hide();
                });
            });

            return bindObject;
        }(),

        getDialog: function() {
            // Cash a div for dialog by self, because $('#dialog_id') cannot exists div element.
            var cash = {};

            return function(editorId, id, title, $content, noCancelButton) {
                var makeDialog = function(id) {
                    var $dialog = $('<div>')
                        .attr('id', id)
                        .attr('title', title)
                        .hide()
                        .append($content);

                    $.extend($dialog, {
                        open: function(defautlValue) {
                            this.dialog({
                                resizable: false,
                                width: 550,
                                height: 220,
                                modal: true,
                                buttons: noCancelButton ? {} : {
                                    Cancel: function() {
                                        $(this).dialog('close');
                                    }
                                }
                            });

                            if (defautlValue) {
                                this.find('[type="text"]')
                                    .val(defautlValue);
                            }
                        },
                        close: function() {
                            this.dialog('close');
                        },
                    });

                    return $dialog;
                };

                var dialogId = editorId + '.' + id;

                if (cash.hasOwnProperty(dialogId)) {
                    return cash[dialogId];
                } else {
                    //make unless exists
                    var $dialog = makeDialog(dialogId);

                    $.extend($content, {
                        dialogClose: function() {
                            $dialog.close();
                        }
                    });

                    $('body').append($dialog);
                    cash[dialogId] = $dialog;
                    return $dialog;
                }
            };
        }(),
    };
    var editor = function() {
        var domUtil = { //domUtil.cursorChanger
            cursorChanger: function(editor) {
                var wait = function() {
                    editor.css('cursor', 'wait');
                };
                var endWait = function() {
                    editor.css('cursor', 'auto');
                };
                return {
                    startWait: wait,
                    endWait: endWait,
                };
            }(this),
            selector: {
                getSelecteds: function() {
                    return $('.ui-selected');
                },
                hasSelecteds: function() {
                    return domUtil.selector.getSelecteds().length > 0;
                },
                span: {
                    get: function(spanId) {
                        return $('#' + spanId);
                    },
                    getSelecteds: function() {
                        return $('.textae-editor__span.ui-selected');
                    },
                    getNumberOfSelected: function() {
                        return domUtil.selector.span.getSelecteds().length;
                    },
                    hasSelecteds: function() {
                        return domUtil.selector.span.getNumberOfSelected() > 0;
                    },
                    getSelectedId: function() {
                        //return first element id even if multi elements selected.
                        return domUtil.selector.span.getSelecteds().attr('id');
                    },
                    popSelectedId: function() {
                        var ss = domUtil.selector.span.getSelecteds();
                        if (ss.length === 1) {
                            ss.removeClass('ui-selected');
                            return ss.attr('id');
                        } else {
                            return null;
                        }
                    },
                    select: function(spanId) {
                        domUtil.manipulate.select(domUtil.selector.span.get(spanId));
                    },
                },
                entity: {
                    get: function(entityId) {
                        return $('#' + idFactory.makeEntityDomId(entityId));
                    },
                    getSelecteds: function() {
                        return $('.textae-editor__entity.ui-selected');
                    },
                    getNumberOfSelected: function() {
                        return domUtil.selector.entity.getSelecteds().length;
                    },
                    hasSelecteds: function() {
                        return domUtil.selector.entity.getNumberOfSelected() > 0;
                    },
                    getSelectedId: function() {
                        return domUtil.selector.entity.getSelecteds().attr('title');
                    },
                    select: function(entityId) {
                        domUtil.manipulate.select(domUtil.selector.entity.get(entityId));
                    },
                },
                grid: {
                    get: function(spanId) {
                        return $('#G' + spanId);
                    }
                },
            },
            manipulate: function() {
                var isSelected = function(target) {
                    return $(target).hasClass('ui-selected');
                };
                var select = function() {
                    if (!isSelected(this)) {
                        $(this).addClass('ui-selected').trigger('selectChanged', true);
                    }
                };
                var deselect = function() {
                    if (isSelected(this)) {
                        $(this).removeClass('ui-selected').trigger('selectChanged', false);
                    }
                };
                var toggle = function() {
                    if (isSelected(this)) {
                        deselect.apply(this);
                    } else {
                        select.apply(this);
                    }
                };
                var remove = function() {
                    var $self = $(this);
                    deselect.call($self.add($self.find('.ui-selected')));
                    $self.remove();
                };
                var applyMultiJQueryObject = function(func, target) {
                    // A target may be multi jQuery object.
                    return $(target).each(func);
                };

                return {
                    select: applyMultiJQueryObject.bind(null, select),
                    deselect: applyMultiJQueryObject.bind(null, deselect),
                    toggle: applyMultiJQueryObject.bind(null, toggle),
                    remove: applyMultiJQueryObject.bind(null, remove),
                    selectOnly: function(target) {
                        domUtil.manipulate.deselect(domUtil.selector.getSelecteds().not(target));
                        view.renderer.relation.clearRelationSelection();

                        domUtil.manipulate.select(target);
                    },
                    unselect: function() {
                        domUtil.manipulate.deselect(domUtil.selector.getSelecteds());
                        view.renderer.relation.clearRelationSelection();
                    },
                    // dismiss the default selection by the browser
                    dismissBrowserSelection: function() {
                        var selection = window.getSelection();
                        selection.collapse(document.body, 0);
                    },
                };
            }(),
        };

        // constant values
        var CONSTS = {
            BLOCK_THRESHOLD: 100
        };

        // A sub component to save and load data.
        var dataAccessObject = function(self) {
            //load/saveDialog
            var loadSaveDialog = function() {
                var getLoadDialog = function() {
                    var $content = $('<div>')
                        .append('<div>Sever :<input type="text" class="textae-editor__load-dialog__file-name" /><input type="button" value="OK" /></div>')
                        .append('<div>Local :<input type="file"　/></div>')
                        .on('change', '[type="file"]',
                            function() {
                                dataAccessObject.getAnnotationFromFile(this);
                                $content.dialogClose();
                            })
                        .on('click', '[type="button"]',
                            function() {
                                var url = $content.find('.textae-editor__load-dialog__file-name').val();
                                dataAccessObject.getAnnotationFromServer(url);
                                $content.dialogClose();
                            });

                    return textAeUtil.getDialog(self.editorId, 'textae.dialog.load', 'Load document with annotation.', $content);
                };

                var getSaveDialog = function() {
                    var $content = $('<div>')
                        .append('<div>Sever :<input type="text" class="textae-editor__save-dialog__file-name" /><input type="button" value="OK" /></div>')
                        .append('<div>Local :<span class="span_link_place"><a target="_blank"/></span></div>')
                        .on('click', 'a', function() {
                            controller.command.updateSavePoint();
                            $content.dialogClose();
                        })
                        .on('click', '[type="button"]', function() {
                            var url = $content.find('.textae-editor__save-dialog__file-name').val();
                            dataAccessObject.saveAnnotationToServer(url);
                            $content.dialogClose();
                        });

                    return textAeUtil.getDialog(self.editorId, 'textae.dialog.save', 'Save document with annotation.', $content);
                };

                return {
                    showLoad: function(url) {
                        getLoadDialog().open(url);
                    },
                    showSave: function(url, downloadPath) {
                        var createFileLink = function($save_dialog, downloadPath) {
                            var $fileInput = getLoadDialog().find("input[type='file']");

                            var file = $fileInput.prop('files')[0];
                            var name = file ? file.name : 'annotations.json';
                            var link = $save_dialog.find('a')
                                .text(name)
                                .attr('href', downloadPath)
                                .attr('download', name);
                        };

                        var $dialog = getSaveDialog();

                        //create local link
                        createFileLink($dialog, downloadPath);

                        //open dialog
                        $dialog.open(url);
                    }
                };
            }();

            var getMessageArea = function() {
                $messageArea = self.find('.textae-editor__footer .textae-editor__footer__message');
                if ($messageArea.length === 0) {
                    $messageArea = $("<div>").addClass("textae-editor__footer__message");
                    var $footer = $("<div>")
                        .addClass("textae-editor__footer")
                        .append($messageArea);
                    self.append($footer);
                }

                return $messageArea;
            };

            var showSaveSuccess = function() {
                getMessageArea().html("annotation saved").fadeIn().fadeOut(5000, function() {
                    $(this).html('').removeAttr('style');
                    setDataSourceUrl(dataSourceUrl);
                });
                controller.command.updateSavePoint();
                domUtil.cursorChanger.endWait();
            };

            var showSaveError = function() {
                getMessageArea.html("could not save").fadeIn().fadeOut(5000, function() {
                    $(this).html('').removeAttr('style');
                    setDataSourceUrl(dataSourceUrl);
                });
                domUtil.cursorChanger.endWait();
            };

            var setDataSourceUrl = function(url) {
                if (url !== "") {
                    var targetDoc = url.replace(/\/annotations\.json$/, '');
                    getMessageArea().html("(Target: <a href='" + targetDoc + "'>" + targetDoc + "</a>)");
                    dataSourceUrl = url;
                }
            };

            var dataSourceUrl = "";

            return {
                getAnnotationFromServer: function(url) {
                    domUtil.cursorChanger.startWait();
                    textAeUtil.ajaxAccessor.getAsync(url, function(annotation) {
                        controller.command.reset(annotation);
                        setDataSourceUrl(url);
                    }, function() {
                        domUtil.cursorChanger.endWait();
                    });
                },
                getAnnotationFromFile: function(fileEvent) {
                    var reader = new FileReader();
                    reader.onload = function() {
                        var annotation = JSON.parse(this.result);
                        controller.command.reset(annotation);
                    };
                    reader.readAsText(fileEvent.files[0]);
                },
                saveAnnotationToServer: function(url) {
                    domUtil.cursorChanger.startWait();
                    var postData = model.annotationData.toJason();
                    textAeUtil.ajaxAccessor.post(url, postData, showSaveSuccess, showSaveError, function() {
                        domUtil.cursorChanger.endWait();
                    });
                    controller.command.updateSavePoint();
                },
                showAccess: function() {
                    loadSaveDialog.showLoad(dataSourceUrl);
                },
                showSave: function() {
                    var createSaveFile = function(contents) {
                        var blob = new Blob([contents], {
                            type: 'application/json'
                        });
                        return URL.createObjectURL(blob);
                    };

                    loadSaveDialog.showSave(dataSourceUrl, createSaveFile(model.annotationData.toJason()));
                },
            };
        }(this);

        var idFactory = function(editor) {
            return {
                // paragraph id
                makeParagraphId: function(index) {
                    return editor.editorId + '__P' + index;
                },
                // span id
                makeSpanId: function(begin, end) {
                    return editor.editorId + '__S' + begin + '_' + end;
                },
                parseSpanId: function(spanId) {
                    var beginEnd = spanId.replace(editor.editorId + '__S', '').split('_');
                    return {
                        begin: beginEnd[0],
                        end: beginEnd[1]
                    };
                },
                // type id
                makeTypeId: function(sid, type) {
                    return sid + '-' + type;
                },
                makeEntityDomId: function(entityId) {
                    return editor.editorId + '__E' + entityId;
                }
            };
        }(this);

        // model manages data objects.
        var model = function(editor) {
            // Configulation of span
            var spanConfig = {
                delimiterCharacters: null,
                nonEdgeCharacters: null,
                defaults: {
                    "delimiter characters": [
                        " ",
                        ".",
                        "!",
                        "?",
                        ",",
                        ":",
                        ";",
                        "-",
                        "/",
                        "&",
                        "(",
                        ")",
                        "{",
                        "}",
                        "[",
                        "]",
                        "+",
                        "*",
                        "\\",
                        "\"",
                        "'",
                        "\n",
                        "–"
                    ],
                    "non-edge characters": [
                        " ",
                        "\n"
                    ]
                },
                set: function(config) {
                    var settings = $.extend({}, this.defaults, config);

                    if (settings['delimiter characters'] !== undefined) {
                        this.delimiterCharacters = settings['delimiter characters'];
                    }

                    if (settings['non-edge characters'] !== undefined) {
                        this.nonEdgeCharacters = settings['non-edge characters'];
                    }
                },
                isNonEdgeCharacter: function(char) {
                    return (this.nonEdgeCharacters.indexOf(char) >= 0);
                },
                isDelimiter: function(char) {
                    return (this.delimiterCharacters.indexOf(char) >= 0);
                }
            };
            return {
                init: function() {
                    var setTypeConfig = function(config) {
                        model.entityTypes.set(config['entity types']);
                        model.setRelationTypes(config['relation types']);

                        if (config.css !== undefined) {
                            $('#css_area').html('<link rel="stylesheet" href="' + config.css + '"/>');
                        }
                    };

                    // read default model.spanConfig
                    model.spanConfig.set();

                    // Read model parameters from url parameters and html attributes.
                    // Html attributes preced url parameters.
                    var params = $.extend(textAeUtil.getUrlParameters(location.search), {
                        debug: editor.attr("debug"),
                        config: editor.attr("config"),
                        target: editor.attr("target")
                    });

                    if (params.config && params.config !== "") {
                        // load sync, because load annotation after load config. 
                        var data = textAeUtil.ajaxAccessor.getSync(params.config);
                        if (data !== null) {
                            model.spanConfig.set(data);
                            setTypeConfig(data);
                        } else {
                            alert('could not read the span configuration from the location you specified.');
                        }
                    }

                    if (params.target && params.target !== "") {
                        dataAccessObject.getAnnotationFromServer(params.target);
                    }
                },
                spanConfig: spanConfig,
                sourceDoc: "",
                annotationData: function() {
                    var spanContainer;
                    var sortedSpanIds = null;
                    var entitiesPerType;

                    var updateSpanTree = function() {
                        // Sort id of spans by the position.
                        var sortedSpans = model.annotationData.getAllSpan().sort(function(a, b) {
                            return a.begin - b.begin || b.end - a.end;
                        });

                        // the spanTree has parent-child structure.
                        var spanTree = [];
                        sortedSpans.forEach(function(span, index, array) {
                            $.extend(span, {
                                // Reset children
                                children: [],
                                // Order by position
                                left: index !== 0 ? array[index - 1] : null,
                                right: index !== array.length - 1 ? array[index + 1] : null,
                            });

                            // Find the parent of this span.
                            var lastPushedSpan = spanTree[spanTree.length - 1];
                            if (span.isChildOf(span.left)) {
                                // The left span is the parent.
                                // The left span may be the parent of a current span because span id is sorted.
                                span.left.children.push(span);
                                span.parent = span.left;
                            } else if (span.left && span.isChildOf(span.left.parent)) {
                                // The left span is the bigBrother.
                                // The parent of the left span may be the parent of a current span.
                                span.left.parent.children.push(span);
                                span.parent = span.left.parent;
                            } else if (span.isChildOf(lastPushedSpan)) {
                                // The last pushed span is the parent.
                                // This occur when prev node is also a child of last pushed span.
                                lastPushedSpan.children.push(span);
                                span.parent = lastPushedSpan;
                            } else {
                                // A current span has no parent.
                                spanTree.push(span);
                            }
                        });

                        //this for debug.
                        spanTree.toString = function() {
                            return this.map(function(span) {
                                return span.toString();
                            }).join("\n");
                        };
                        // console.log(spanTree.toString());

                        sortedSpanIds = sortedSpans.map(function(span) {
                            return span.id;
                        });
                        model.annotationData.spansTopLevel = spanTree;
                    };

                    var getMaxEntityId = function() {
                        var maxIdNum = 0;
                        var entityIds = Object.keys(model.annotationData.entities)
                            .filter(function(eid) {
                                return eid[0] === "E";
                            })
                            .map(function(eid) {
                                return eid.slice(1);
                            });
                        entityIds.sort(function(a, b) {
                            //reverse by number
                            return b - a;
                        });

                        return parseInt(entityIds[0]) || 0;
                    };

                    var innerAddSpan = function(span) {
                        var additionalPropertiesForSpan = {
                            //type is one per one span.
                            types: {},
                            isChildOf: function(maybeParent) {
                                return maybeParent && maybeParent.begin <= span.begin && span.end <= maybeParent.end;
                            },
                            //for debug. print myself only.
                            toStringOnlyThis: function() {
                                return "span " + this.begin + ":" + this.end + ":" + model.sourceDoc.substring(this.begin, this.end);
                            },
                            //for debug. print with children.
                            toString: function(depth) {
                                depth = depth || 1; //default depth is 1

                                var childrenString = this.children.length > 0 ?
                                    "\n" + this.children.map(function(child) {
                                        return new Array(depth + 1).join("\t") + child.toString(depth + 1);
                                    }).join("\n") : "";

                                return this.toStringOnlyThis() + childrenString;
                            },
                            // A big brother is brother node on a structure at rendered.
                            // There is no big brother if the span is first in a paragrpah.
                            // Warning: parent is set at updateSpanTree, is not exists now.
                            getBigBrother: function() {
                                var index;
                                if (this.parent) {
                                    index = this.parent.children.indexOf(this);
                                    return index === 0 ? null : this.parent.children[index - 1];
                                } else {
                                    index = model.annotationData.spansTopLevel.indexOf(this);
                                    return index === 0 || model.annotationData.spansTopLevel[index - 1].paragraph !== this.paragraph ? null : model.annotationData.spansTopLevel[index - 1];
                                }
                            },
                            // Get online for update is not grantieed.
                            getTypes: function() {
                                return $.map(this.types, function(value, key) {
                                    return {
                                        id: key,
                                        name: value,
                                        entities: Object.keys(entitiesPerType[key]),
                                    };
                                });
                            }
                        };

                        //get the paragraph that span is belong to.
                        var findParagraph = function(self) {
                            var match = model.annotationData.paragraphsArray.filter(function(p) {
                                return self.begin >= p.begin && self.end <= p.end;
                            });
                            return match.length > 0 ? match[0] : null;
                        };

                        var spanId = idFactory.makeSpanId(span.begin, span.end);

                        //add a span unless exists, because an annotations.json is defiend by entities so spans are added many times. 
                        if (!model.annotationData.getSpan(spanId)) {
                            //a span is exteded nondestructively to render.
                            spanContainer[spanId] = $.extend({
                                    id: spanId,
                                    paragraph: findParagraph(span),
                                },
                                span,
                                additionalPropertiesForSpan);
                        }
                    };

                    return {
                        entities: null,
                        relations: null,
                        reset: function() {
                            spanContainer = {};
                            model.annotationData.entities = {};
                            model.annotationData.relations = {};
                        },
                        //expected span is like { "begin": 19, "end": 49 }
                        addSpan: function(span) {
                            innerAddSpan(span);
                            updateSpanTree();
                        },
                        removeSpan: function(spanId) {
                            delete spanContainer[spanId];
                            updateSpanTree();
                        },
                        getSpan: function(spanId) {
                            return spanContainer[spanId];
                        },
                        getRangeOfSpan: function(firstId, secondId) {
                            var firstIndex = sortedSpanIds.indexOf(firstId);
                            var secondIndex = sortedSpanIds.indexOf(secondId);

                            //switch if seconfIndex before firstIndex
                            if (secondIndex < firstIndex) {
                                var tmpIndex = firstIndex;
                                firstIndex = secondIndex;
                                secondIndex = tmpIndex;
                            }

                            return sortedSpanIds.slice(firstIndex, secondIndex + 1);
                        },
                        getAllSpan: function() {
                            return $.map(spanContainer, function(span) {
                                return span;
                            });
                        },
                        //expected entity like {id: "E21", span: "editor2__S50_54", type: "Protein"}.
                        addEntity: function(entity) {
                            //expect the span is alredy exists
                            var addEntityToSpan = function(entity) {
                                var addEntityToType = function(typeId, entityId) {
                                    if (!entitiesPerType[typeId]) {
                                        entitiesPerType[typeId] = {};
                                    }
                                    entitiesPerType[typeId][entityId] = null;
                                };

                                var typeId = idFactory.makeTypeId(entity.span, entity.type);
                                //span must have types as object.
                                model.annotationData.getSpan(entity.span).types[typeId] = entity.type;
                                addEntityToType(typeId, entity.id);
                            };

                            model.annotationData.entities[entity.id] = entity;
                            addEntityToSpan(entity);
                        },
                        removeEnitity: function(entityId) {
                            var removeEntityFromSpan = function(spanId, type, entityId) {
                                'use strict';
                                var typeId = idFactory.makeTypeId(spanId, type);

                                //remove entity
                                delete entitiesPerType[typeId][entityId];

                                //remove type
                                if (Object.keys(entitiesPerType[typeId]).length === 0) {
                                    delete entitiesPerType[typeId];
                                    delete model.annotationData.getSpan(spanId).types[typeId];
                                }
                            };

                            var entity = model.annotationData.entities[entityId];
                            if (entity) {
                                removeEntityFromSpan(entity.span, entity.type, entityId);
                                delete model.annotationData.entities[entityId];
                            }
                            return entity;
                        },
                        parseParagraphs: function(sourceDoc) {
                            var paragraphsArray = [];
                            var textLengthBeforeThisParagraph = 0;
                            sourceDoc.split("\n").forEach(function(p, index, array) {
                                paragraphsArray.push({
                                    id: idFactory.makeParagraphId(index),
                                    begin: textLengthBeforeThisParagraph,
                                    end: textLengthBeforeThisParagraph + p.length,
                                });

                                textLengthBeforeThisParagraph += p.length + 1;
                            });
                            model.annotationData.paragraphsArray = paragraphsArray;
                        },
                        //expected denotations Array of object like { "id": "T1", "span": { "begin": 19, "end": 49 }, "obj": "Cell" }.
                        parseDenotations: function(denotations) {
                            if (denotations) {
                                entitiesPerType = {};

                                denotations.forEach(function(entity) {
                                    innerAddSpan(entity.span);
                                    model.annotationData.addEntity({
                                        id: entity.id,
                                        span: idFactory.makeSpanId(entity.span.begin, entity.span.end),
                                        type: entity.obj,
                                    });
                                });

                                updateSpanTree();
                            }
                        },
                        parseRelations: function(relations) {
                            if (relations) {
                                relations.forEach(function(r) {
                                    model.annotationData.relations[r.id] = r;
                                });
                            }
                        },
                        getRelationIds: function() {
                            return Object.keys(model.annotationData.relations);
                        },
                        getNewEntityId: function() {
                            return "E" + (getMaxEntityId() + 1);
                        },
                        toJason: function() {
                            var denotations = [];
                            for (var e in model.annotationData.entities) {
                                var spanId = model.annotationData.entities[e].span;
                                var span = {
                                    'begin': model.annotationData.getSpan(spanId).begin,
                                    'end': model.annotationData.getSpan(spanId).end
                                };
                                denotations.push({
                                    'id': e,
                                    'span': span,
                                    'obj': model.annotationData.entities[e].type
                                });
                            }

                            return JSON.stringify({
                                "text": model.sourceDoc,
                                "denotations": denotations
                            });
                        }
                    };
                }(),
                entityTypes: function() {
                    var types = {},
                        defaultType = "",
                        getColor = function() {
                            return this.color ? this.color : "#77DDDD";
                        };

                    return {
                        setDefaultType: function(nameOfEntityType) {
                            defaultType = nameOfEntityType;
                        },
                        getDefaultType: function() {
                            return defaultType || model.entityTypes.getSortedNames()[0];
                        },
                        getType: function(nameOfEntityType) {
                            types[nameOfEntityType] = types[nameOfEntityType] || {
                                getColor: getColor
                            };
                            return types[nameOfEntityType];
                        },
                        set: function(newEntityTypes) {
                            // expected newEntityTypes is an array of object. example of object is {"name": "Regulation","color": "#FFFF66","default": true}.
                            types = {};
                            defaultType = "";
                            if (newEntityTypes !== undefined) {
                                newEntityTypes.forEach(function(newEntity) {
                                    newEntity.getColor = getColor;
                                    types[newEntity.name] = newEntity;
                                    if (newEntity["default"] === true) {
                                        defaultType = newEntity.name;
                                    }
                                });
                            }
                        },
                        //save number of type, to sort by numer when show entity pallet.
                        incrementNumberOfTypes: function(nameOfEntityType) {
                            //access by square brancket, because nameOfEntityType is user input value, maybe 'null', '-', and other invalid indentifier name.
                            var type = model.entityTypes.getType(nameOfEntityType);
                            type.count = (type.count || 0) + 1;
                        },
                        getSortedNames: function() {
                            //sort by number of types
                            var typeNames = Object.keys(types);
                            typeNames.sort(function(a, b) {
                                return types[b].count - types[a].count;
                            });
                            return typeNames;
                        }
                    };
                }(),
                relationTypes: {},
                relationTypeDefault: '',
                setRelationTypes: function(relationTypes) {
                    if (relationTypes !== undefined) {
                        model.relationTypes = {};
                        model.relationTypeDefault = null;

                        relationTypes.forEach(function(type) {
                            model.relationTypes[type.name] = type;
                            if (type["default"] === true) {
                                model.relationTypeDefault = type.name;
                            }
                        });

                        if (!model.relationTypeDefault) {
                            model.relationTypeDefault = relationTypes[0].name;
                        }
                    }
                },
                relationsPerEntity: {},
                initRelationsPerEntity: function(relations) {
                    if (relations !== undefined) {
                        model.relationsPerEntity = {};
                        relations.forEach(function(r) {
                            // Update model.relationTypes
                            if (!model.relationTypes[r.pred]) {
                                model.relationTypes[r.pred] = {};
                            }

                            if (model.relationTypes[r.pred].count) {
                                model.relationTypes[r.pred].count++;
                            } else {
                                model.relationTypes[r.pred].count = 1;
                            }

                            // initRelationsPerEntity
                            if (model.relationsPerEntity[r.subj]) {
                                if (model.relationsPerEntity[r.subj].indexOf(r.id) < 0) {
                                    model.relationsPerEntity[r.subj].push(r.id);
                                }
                            } else {
                                model.relationsPerEntity[r.subj] = [r.id];
                            }

                            if (model.relationsPerEntity[r.obj]) {
                                if (model.relationsPerEntity[r.obj].indexOf(r.id) < 0) {
                                    model.relationsPerEntity[r.obj].push(r.id);
                                }
                            } else {
                                model.relationsPerEntity[r.obj] = [r.id];
                            }
                        });
                    }
                },
                connectorTypes: {},
                initConnectorTypes: function() {
                    var getRelationColor = function(type) {
                        if (model.relationTypes[type] && model.relationTypes[type].color) {
                            return model.relationTypes[type].color;
                        } else {
                            return "#555555";
                        }
                    };

                    var converseHEXinotRGBA = function(color, opacity) {
                        var c = color.slice(1);
                        var r = c.substr(0, 2);
                        var g = c.substr(2, 2);
                        var b = c.substr(4, 2);
                        r = parseInt(r, 16);
                        g = parseInt(g, 16);
                        b = parseInt(b, 16);

                        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
                    };

                    model.connectorTypes = {};

                    for (var name in model.relationTypes) {
                        var colorHex = getRelationColor(name);
                        var paintRGBA = converseHEXinotRGBA(colorHex, view.renderer.relation.settings.connOpacity);
                        var hoverRGBA = converseHEXinotRGBA(colorHex, 1);

                        model.connectorTypes[name] = {
                            paintStyle: {
                                strokeStyle: paintRGBA,
                                lineWidth: 1
                            },
                            hoverPaintStyle: {
                                strokeStyle: hoverRGBA,
                                lineWidth: 3
                            }
                        };
                        model.connectorTypes[name + '_selected'] = {
                            paintStyle: {
                                strokeStyle: hoverRGBA,
                                lineWidth: 3
                            },
                            hoverPaintStyle: {
                                strokeStyle: hoverRGBA,
                                lineWidth: 3
                            }
                        };
                    }
                },
                getReplicationSpans: function(originSpan) {
                    // Get spans their stirng is same with the originSpan from sourceDoc.
                    var getSpansTheirStringIsSameWith = function(originSpan) {
                        var getNextStringIndex = String.prototype.indexOf.bind(model.sourceDoc, model.sourceDoc.substring(originSpan.begin, originSpan.end));
                        var length = originSpan.end - originSpan.begin;

                        var findStrings = [];
                        var offset = 0;
                        for (var index = getNextStringIndex(offset); index !== -1; index = getNextStringIndex(offset)) {
                            findStrings.push({
                                begin: index,
                                end: index + length
                            });

                            offset = index + length;
                        }
                        return findStrings;
                    };

                    // The candidateSpan is a same span when begin is same.
                    // Because string of each others are same. End of them are same too.
                    var isOriginSpan = function(candidateSpan) {
                        return candidateSpan.begin === originSpan.begin;
                    };

                    // The preceding charactor and the following of a word charactor are delimiter.
                    // For example, 't' ,a part of 'that', is not same with an origin span when it is 't'. 
                    var isWord = function(candidateSpan) {
                        var precedingChar = model.sourceDoc.charAt(candidateSpan.begin - 1);
                        var followingChar = model.sourceDoc.charAt(candidateSpan.end);

                        return model.spanConfig.isDelimiter(precedingChar) && model.spanConfig.isDelimiter(followingChar);
                    };

                    // Is the candidateSpan is spaned already?
                    var isAlreadySpaned = function(candidateSpan) {
                        return model.annotationData.getAllSpan().filter(function(existSpan) {
                            return existSpan.begin === candidateSpan.begin && existSpan.end === candidateSpan.end;
                        }).length > 0;
                    };

                    // A span its range is coross over with other spans are not able to rendered.
                    // Because spans are renderd with span tag. Html tags can not be cross over.
                    var isBoundaryCrossingWithOtherSpans = function(candidateSpan) {
                        return model.annotationData.getAllSpan().filter(function(existSpan) {
                            return (existSpan.begin < candidateSpan.begin && candidateSpan.begin < existSpan.end && existSpan.end < candidateSpan.end) ||
                                (candidateSpan.begin < existSpan.begin && existSpan.begin < candidateSpan.end && candidateSpan.end < existSpan.end);
                        }).length > 0;
                    };

                    return getSpansTheirStringIsSameWith(originSpan).filter(function(span) {
                        return !isOriginSpan(span) && isWord(span) && !isAlreadySpaned(span) && !isBoundaryCrossingWithOtherSpans(span);
                    });
                },
                reset: function(annotation) {
                    var parseSouseDoc = function(data) {
                        //validate
                        if (data.text === undefined) {
                            alert("read failed.");
                            return;
                        }

                        //parse a souce document.
                        model.sourceDoc = data.text;
                        model.annotationData.parseParagraphs(data.text);
                    };
                    var parseDenotations = function(data) {
                        model.annotationData.parseDenotations(data.denotations);
                        if (data.denotations !== undefined) {
                            data.denotations.forEach(function(d) {
                                //d.obj is type of entity.
                                model.entityTypes.incrementNumberOfTypes(d.obj);
                            });
                        }
                    };
                    var parseRelations = function(data) {
                        model.annotationData.parseRelations(data.relations);
                        model.initRelationsPerEntity(data.relations);
                        model.initConnectorTypes();
                    };

                    model.annotationData.reset();
                    parseSouseDoc(annotation);
                    parseDenotations(annotation);
                    parseRelations(annotation);
                },
            };
        }(this);

        var view = function(editor) {
            var TYPE_MARGIN_TOP = 18;
            var TYPE_MARGIN_BOTTOM = 2;

            // Data for view.
            var viewModel = function() {
                return {
                    // view.viewModel.clipBoard has entity id only.
                    clipBoard: [],
                    isReplicateAuto: false,
                    // Helper to update button state. 
                    buttonStateHelper: function() {
                        var disableButtons = {};
                        var updateDisableButtons = function(button, enable) {
                            if (enable) {
                                delete disableButtons[button];
                            } else {
                                disableButtons[button] = false;
                            }
                        };
                        var updateEntity = function() {
                            updateDisableButtons("entity", domUtil.selector.span.getNumberOfSelected() > 0);
                        };
                        var updatePaste = function() {
                            updateDisableButtons("paste", view.viewModel.clipBoard.length > 0 && domUtil.selector.span.getNumberOfSelected() > 0);
                        };
                        var updateReplicate = function() {
                            updateDisableButtons("replicate", domUtil.selector.span.getNumberOfSelected() == 1);
                        };
                        var updatePallet = function() {
                            updateDisableButtons("pallet", domUtil.selector.entity.getNumberOfSelected() > 0);
                        };
                        var updateNewLabel = function() {
                            updateDisableButtons("change-label", domUtil.selector.entity.getNumberOfSelected() > 0);
                        };
                        var updateDelete = function() {
                            updateDisableButtons("delete", domUtil.selector.hasSelecteds());
                        };
                        var updateCopy = function() {
                            updateDisableButtons("copy", domUtil.selector.span.hasSelecteds() || domUtil.selector.entity.hasSelecteds());
                        };
                        var updateBySpanAndEntityBoth = function() {
                            updateDelete();
                            updateCopy();
                        };
                        return {
                            init: function() {
                                updateBySpanAndEntityBoth();

                                updateEntity();
                                updatePaste();
                                updateReplicate();
                                updatePallet();
                                updateNewLabel();

                                this.renderEnable();
                            },
                            pushed: function(button, push) {
                                editor.tool.pushReplicateAuto(push);
                            },
                            renderEnable: function() {
                                editor.tool.changeButtonState(disableButtons);
                            },
                            enabled: function(button, enable) {
                                updateDisableButtons(button, enable);
                                this.renderEnable();
                            },
                            updateBySpan: function() {
                                updateBySpanAndEntityBoth();

                                updateEntity();
                                updatePaste();
                                updateReplicate();

                                this.renderEnable();
                            },
                            updateByEntity: function() {
                                updateBySpanAndEntityBoth();

                                updatePallet();
                                updateNewLabel();

                                this.renderEnable();
                            }
                        };
                    }(),
                    toggleReplicateAuto: function() {
                        view.viewModel.isReplicateAuto = !view.viewModel.isReplicateAuto;
                        view.viewModel.buttonStateHelper.pushed("replicate-auto", view.viewModel.isReplicateAuto);
                    },
                    viewMode: function() {
                        var mode;
                        return {
                            get: function() {
                                return mode;
                            },
                            set: function() {
                                // Set visibility style to hide entities, because size of entiies are necesarry to render relation.
                                // Relations are rendered and set invisible when 'Term Centric View'.
                                var showEntityPaneFunc = function() {
                                    this.css({
                                        'visibility': 'visible'
                                    });
                                };
                                var hideEntityPaneFunc = function() {
                                    this.css({
                                        'visibility': 'hidden'
                                    });
                                };

                                var refreshExistsDom = function(mode) {
                                    var showAllEntities = function() {
                                        var originalMarginBottomOfGrid = TYPE_MARGIN_BOTTOM;
                                        return function() {
                                            showEntityPaneFunc.apply(editor.find('.textae-editor__entity-pane'));
                                            editor.find('.textae-editor__type_term-centric-mode')
                                                .removeClass('textae-editor__type_term-centric-mode')
                                                .addClass('textae-editor__type');

                                            TYPE_MARGIN_BOTTOM = originalMarginBottomOfGrid;
                                        };
                                    }();

                                    var hideAllEntities = function() {
                                        hideEntityPaneFunc.apply(editor.find('.textae-editor__entity-pane'));
                                        editor.find('.textae-editor__type')
                                            .removeClass('textae-editor__type')
                                            .addClass('textae-editor__type_term-centric-mode');

                                        // Override margin-bottom of gird.
                                        TYPE_MARGIN_BOTTOM = 0;
                                    };

                                    var setAllRelationsVisible = function(isShow) {
                                        $.map(view.renderer.relation.cachedConnectors, function(connector) {
                                            return connector;
                                        }).forEach(function(connector) {
                                            connector.setConnectorVisible(isShow);
                                        });
                                    };

                                    if (mode === 'TERM') {
                                        hideAllEntities();
                                        setAllRelationsVisible(false);
                                    } else if (mode === 'INSTANCE') {
                                        showAllEntities();
                                        setAllRelationsVisible(true);
                                    }
                                };

                                var changeMethodForRender = function(mode) {
                                    // A Type element has an entity_pane elment that has a label and will have entities.
                                    var createEmptyTypeDomElementTemplateFunction = function(entityPaneVisibleFunc, classOfEntityTypeForViewMode, spanId, type) {
                                        var typeId = idFactory.makeTypeId(spanId, type);
                                        // The EntityPane will have entities.
                                        var $entityPane = $('<div>')
                                            .attr('id', 'P-' + typeId)
                                            .addClass('textae-editor__entity-pane');

                                        entityPaneVisibleFunc.apply($entityPane);

                                        // Label over the span.
                                        var $typeLabel = $('<div>')
                                            .addClass('textae-editor__type-label')
                                            .text(type)
                                            .css({
                                                'background-color': model.entityTypes.getType(type).getColor(),
                                            });

                                        return $('<div>')
                                            .attr('id', typeId)
                                            .addClass(classOfEntityTypeForViewMode)
                                            .css({
                                                'padding-top': TYPE_MARGIN_TOP,
                                                'margin-bottom': TYPE_MARGIN_BOTTOM
                                            })
                                            .append($typeLabel)
                                            .append($entityPane); // Set pane after label because pane is over label.
                                    };

                                    if (mode === 'TERM') {
                                        // Relations are not redrawed.
                                        view.renderer.helper.redraw = view.renderer.grid.arrangePositionAll;

                                        // Create entity as invisible
                                        view.renderer.entity.createEmptyTypeDomElement = createEmptyTypeDomElementTemplateFunction.bind(null, hideEntityPaneFunc, 'textae-editor__type_term-centric-mode');

                                        // Create relation as invisible
                                        view.renderer.relation.render = function(relationId) {
                                            view.renderer.relation.renderRelation(relationId).setConnectorVisible(false);
                                        };
                                    } else if (mode === 'INSTANCE') {
                                        // Relations are redrawed.
                                        view.renderer.helper.redraw = function() {
                                            view.renderer.grid.arrangePositionAll();
                                            view.renderer.relation.arrangePositionAll();
                                        };

                                        // Create entity as visible
                                        view.renderer.entity.createEmptyTypeDomElement = createEmptyTypeDomElementTemplateFunction.bind(null, showEntityPaneFunc, 'textae-editor__type');

                                        view.renderer.relation.render = view.renderer.relation.renderRelation;
                                    }
                                };

                                return function(newMode) {
                                    mode = newMode;
                                    refreshExistsDom(newMode);
                                    changeMethodForRender(newMode);
                                };
                            }()
                        };
                    }(),
                };
            }();

            // Render DOM elements conforming with the Model.
            var renderer = function() {
                var destroyGrid = function(spanId) {
                    domUtil.manipulate.remove(domUtil.selector.grid.get(spanId));
                };

                // Utility functions for get positions of elemnts.
                var positionUtils = {
                    getSpan: function(spanId) {
                        var $span = domUtil.selector.span.get(spanId);

                        if ($span.length === 0) {
                            throw new Error("span is not renderd : " + spanId);
                        }

                        return {
                            top: $span.get(0).offsetTop,
                            left: $span.get(0).offsetLeft,
                            width: $span.outerWidth(),
                            height: $span.outerHeight(),
                            center: $span.get(0).offsetLeft + $span.outerWidth() / 2,
                        };
                    },
                    getGrid: function(spanId) {
                        var $grid = domUtil.selector.grid.get(spanId);
                        var gridElement = $grid.get(0);

                        return gridElement ? {
                            top: gridElement.offsetTop,
                            left: gridElement.offsetLeft,
                            height: $grid.outerHeight(),
                        } : {
                            top: 0,
                            left: 0,
                            height: 0
                        };
                    },
                    getEntity: function(entityId) {
                        var spanId = model.annotationData.entities[entityId].span;

                        var $entity = domUtil.selector.entity.get(entityId);
                        if ($entity.length === 0) {
                            throw new Error("entity is not rendered : " + entityId);
                        }

                        var gridPosition = positionUtils.getGrid(spanId);
                        var entityElement = $entity.get(0);
                        return {
                            top: gridPosition.top + entityElement.offsetTop,
                            center: gridPosition.left + entityElement.offsetLeft + $entity.outerWidth() / 2,
                        };
                    },
                };

                var getElement = function($parent, tagName, className) {
                    var $area = $parent.find('.' + className);
                    if ($area.length === 0) {
                        $area = $('<' + tagName + '>').addClass(className);
                        $parent.append($area);
                    }
                    return $area;
                };

                // Make the display area for text, spans, denotations, relations.
                var displayArea = getElement(editor, 'div', 'textae-editor__body');

                // Get the display area for denotations and relations.
                var getAnnotationArea = function() {
                    return getElement(displayArea, 'div', 'textae-editor__body__annotation-box');
                };

                return {
                    reset: function() {
                        // the Souce document has multi paragraphs that are splited by '\n'.
                        var getTaggedSourceDoc = function() {
                            //set sroucedoc tagged <p> per line.
                            return model.sourceDoc.split("\n").map(function(par) {
                                return '<p class="textae-editor__body__text-box__paragraph">' + par + '</p>';
                            }).join("\n");
                        };

                        // Paragraphs is Object that has position of charactor at start and end of the statement in each paragraph.
                        var makeParagraphs = function() {
                            var paragraphs = {};

                            //enchant id to paragraph element and chache it.
                            view.renderer.helper.getSourceDocArea().find('p').each(function(index, element) {
                                var $element = $(element);
                                var paragraph = $.extend(model.annotationData.paragraphsArray[index], {
                                    element: $element,
                                });
                                $element.attr('id', paragraph.id);

                                paragraphs[paragraph.id] = paragraph;
                            });

                            return paragraphs;
                        };

                        // Render the source document
                        view.renderer.helper.getSourceDocArea().html(getTaggedSourceDoc());
                        view.renderer.paragraphs = makeParagraphs();

                        // Render annotations
                        getAnnotationArea().empty();
                        view.renderer.helper.renderAllSpan();

                        // Render relations
                        view.renderer.helper.renderAllRelation();
                    },
                    helper: function() {
                        return {
                            // Get the display area for text and spans.
                            getSourceDocArea: function() {
                                return getElement(displayArea, 'span', 'textae-editor__body__text-box');
                            },
                            renderAllSpan: function() {
                                // For tuning
                                // var startTime = new Date();

                                model.annotationData.spansTopLevel.forEach(function(span) {
                                    view.renderer.span.render(span.id);
                                });

                                // For tuning
                                // var endTime = new Date();
                                // console.log('render all span : ', endTime.getTime() - startTime.getTime() + 'ms');
                            },
                            renderAllRelation: function() {
                                view.renderer.relation.reset();

                                model.annotationData.getRelationIds()
                                    .forEach(function(relationId) {
                                        view.renderer.relation.render(relationId);
                                    });
                            },
                            changeLineHeight: function(heightValue) {
                                editor.find('.textae-editor__body__text-box').css({
                                    'line-height': heightValue * 100 + '%'
                                });
                            },
                        };
                    }(),
                    span: {
                        render: function(spanId) {
                            var renderSingleSpan = function(currentSpan) {
                                // Create the Range to a new span add 
                                var createRange = function(textNode, textNodeStartPosition) {
                                    var startPos = currentSpan.begin - textNodeStartPosition;
                                    var endPos = currentSpan.end - textNodeStartPosition;
                                    if (startPos < 0 || textNode.length < endPos) {
                                        throw new Error('oh my god! I cannot render this span. ' + currentSpan.toStringOnlyThis() + ', textNode ' + textNode.textContent);
                                    }

                                    var range = document.createRange();
                                    range.setStart(textNode, startPos);
                                    range.setEnd(textNode, endPos);
                                    return range;
                                };

                                // Get the Range to that new span tag insert.
                                // This function works well when no child span is rendered. 
                                var getRangeToInsertSpanTag = function(spanId) {
                                    var createRangeForFirstSpanInParagraph = function(currentSpan) {
                                        var paragraph = view.renderer.paragraphs[currentSpan.paragraph.id];
                                        textNodeInParagraph = paragraph.element.contents().filter(function() {
                                            return this.nodeType === 3; //TEXT_NODE
                                        }).get(0);
                                        return createRange(textNodeInParagraph, paragraph.begin);
                                    };

                                    // The parent of the bigBrother is same with currentSpan, whitc is a span or the root of spanTree. 
                                    var bigBrother = currentSpan.getBigBrother();
                                    if (bigBrother) {
                                        // The target text arrounded by currentSpan is in a textNode after the bigBrother if bigBrother exists.
                                        return createRange(document.getElementById(bigBrother.id).nextSibling, bigBrother.end);
                                    } else {
                                        // The target text arrounded by currentSpan is the first child of parent unless bigBrother exists.
                                        if (currentSpan.parent) {
                                            // The parent is span
                                            var textNodeInPrevSpan = domUtil.selector.span.get(currentSpan.parent.id).contents().filter(function() {
                                                return this.nodeType === 3;
                                            }).get(0);
                                            return createRange(textNodeInPrevSpan, currentSpan.parent.begin);
                                        } else {
                                            // The parent is paragraph
                                            return createRangeForFirstSpanInParagraph(currentSpan);
                                        }
                                    }
                                };

                                var element = document.createElement('span');
                                element.setAttribute('id', currentSpan.id);
                                element.setAttribute('title', currentSpan.id);
                                element.setAttribute('class', 'textae-editor__span');
                                getRangeToInsertSpanTag(currentSpan.id).surroundContents(element);
                            };

                            var renderEntitiesOfSpan = function(span) {
                                span.getTypes().forEach(function(type) {
                                    type.entities.forEach(function(entityId) {
                                        view.renderer.entity.render(model.annotationData.entities[entityId]);
                                    });
                                });
                            };

                            var destroyChildrenSpan = function(currentSpan) {
                                // Destroy DOM elements of descendant spans.
                                var destroySpanRecurcive = function(span) {
                                    span.children.forEach(function(span) {
                                        destroySpanRecurcive(span);
                                    });
                                    view.renderer.span.destroy(span.id);
                                };

                                // Destroy rendered children.
                                currentSpan.children.filter(function(childSpan) {
                                    return document.getElementById(childSpan.id) !== null;
                                }).forEach(function(childSpan) {
                                    destroySpanRecurcive(childSpan);
                                });
                            };

                            var currentSpan = model.annotationData.getSpan(spanId);

                            // Destroy children spans to wrap a TextNode with <span> tag when new span over exists spans.
                            destroyChildrenSpan(currentSpan);

                            renderSingleSpan(currentSpan);
                            renderEntitiesOfSpan(currentSpan);

                            // Render children spans.
                            currentSpan.children.filter(function(childSpan) {
                                return document.getElementById(childSpan.id) === null;
                            }).forEach(function(childSpan) {
                                view.renderer.span.render(childSpan.id);
                            });

                            view.renderer.grid.arrangePosition(currentSpan);
                        },
                        destroy: function(spanId) {
                            var spanElement = document.getElementById(spanId);
                            var parent = spanElement.parentNode;

                            // Move the textNode wrapped this span in front of this span.
                            while (spanElement.firstChild) {
                                parent.insertBefore(spanElement.firstChild, spanElement);
                            }

                            domUtil.manipulate.remove(spanElement);
                            parent.normalize();

                            // Destroy a grid of the span. 
                            destroyGrid(spanId);
                        },
                    },
                    entity: function() {
                        var getTypeDom = function(spanId, type) {
                            return $('#' + idFactory.makeTypeId(spanId, type));
                        };

                        // Arrange a position of the pane to center entities when entities width is longer than pane width.
                        var arrangePositionOfPane = function(pane) {
                            var paneWidth = pane.outerWidth();
                            var entitiesWidth = pane.find('.textae-editor__entity').toArray().map(function(e) {
                                return e.offsetWidth;
                            }).reduce(function(pv, cv) {
                                return pv + cv;
                            }, 0);

                            pane.css({
                                'left': entitiesWidth > paneWidth ? (paneWidth - entitiesWidth) / 2 : 0
                            });
                        };

                        var removeEntityElement = function(entity) {
                            var doesTypeHasNoEntity = function(typeName) {
                                return model.annotationData.getSpan(entity.span).getTypes().filter(function(type) {
                                    return type.name === typeName;
                                }).length === 0;
                            };

                            // Get old type from Dom, Because the entity may have new type when changing type of the entity.
                            var oldType = domUtil.manipulate.remove(domUtil.selector.entity.get(entity.id)).attr('type');

                            // Delete type if no entity.
                            if (doesTypeHasNoEntity(oldType)) {
                                getTypeDom(entity.span, oldType).remove();
                            } else {
                                // Arrage the position of TypePane, because number of entities decrease.
                                arrangePositionOfPane(getTypeDom(entity.span, oldType).find('.textae-editor__entity-pane'));
                            }
                        };

                        return {
                            // An entity is a circle on Type that is an endpoint of a relation.
                            // A span have one grid and a grid can have multi types and a type can have multi entities.
                            // A grid is only shown when at least one entity is owned by a correspond span.  
                            render: function(entity) {
                                //render type unless exists.
                                var getTypeElement = function(spanId, type) {
                                    var getGrid = function(spanId) {
                                        var createGrid = function(spanId) {
                                            var spanPosition = positionUtils.getSpan(spanId);
                                            var $grid = $('<div>')
                                                .attr('id', 'G' + spanId)
                                                .addClass('textae-editor__grid')
                                                .css({
                                                    'width': spanPosition.width
                                                });

                                            //append to the annotation area.
                                            getAnnotationArea().append($grid);

                                            return $grid;
                                        };

                                        // Create a grid unless it exists.
                                        var $grid = domUtil.selector.grid.get(spanId);
                                        if ($grid.length === 0) {
                                            return createGrid(spanId);
                                        } else {
                                            return $grid;
                                        }
                                    };

                                    var $type = getTypeDom(spanId, type);
                                    if ($type.length === 0) {
                                        $type = view.renderer.entity.createEmptyTypeDomElement(spanId, type);
                                        getGrid(spanId).append($type);
                                    }

                                    return $type;
                                };

                                var createEntityElement = function(entity) {
                                    return $('<div>')
                                        .attr('id', idFactory.makeEntityDomId(entity.id))
                                        .attr('title', entity.id)
                                        .attr('type', String(entity.type)) // Replace null to 'null' if type is null. 
                                    .addClass('textae-editor__entity')
                                        .css({
                                            'border-color': model.entityTypes.getType(entity.type).getColor()
                                        });
                                };

                                // Append a new entity to the type
                                var pane = getTypeElement(entity.span, entity.type)
                                    .find('.textae-editor__entity-pane')
                                    .append(createEntityElement(entity));

                                arrangePositionOfPane(pane);
                            },
                            destroy: function(entity) {
                                var doesSpanHasNoEntity = function(spanId) {
                                    return model.annotationData.getSpan(spanId).getTypes().length === 0;
                                };

                                if (doesSpanHasNoEntity(entity.span)) {
                                    // Destroy a grid when all entities are remove. 
                                    destroyGrid(entity.span);
                                } else {
                                    // Destroy an each entity.
                                    removeEntityElement(entity);
                                }
                            },
                            changeTypeOfExists: function(entity) {
                                // Remove old entity.
                                removeEntityElement(entity);

                                // Show new enitty.
                                view.renderer.entity.render(entity);
                            },
                        };
                    }(),
                    grid: {
                        arrangePosition: function(span) {
                            var stickGridOnSpan = function(span) {
                                var spanId = span.id;
                                var spanPosition = positionUtils.getSpan(spanId);
                                var gridPosition = positionUtils.getGrid(spanId);
                                domUtil.selector.grid.get(spanId).css({
                                    'top': spanPosition.top - TYPE_MARGIN_BOTTOM - gridPosition.height,
                                    'left': spanPosition.left
                                });
                            };

                            var pullUpGridOverDescendants = function(span) {
                                var getChildrenMaxHeight = function(span) {
                                    return span.children.length === 0 ? 0 :
                                        Math.max.apply(null, span.children.map(function(childSpan) {
                                            return domUtil.selector.span.get(childSpan.id).outerHeight();
                                        }));
                                };

                                // Culculate the height of the grid include descendant grids, because css style affects slowly.
                                var getHeightIncludeDescendantGrids = function(span) {
                                    var descendantsMaxHeight = span.children.length === 0 ? 0 :
                                        Math.max.apply(null, span.children.map(function(childSpan) {
                                            return getHeightIncludeDescendantGrids(childSpan);
                                        }));

                                    // console.log(span.id, 'childrenMaxHeight', descendantsMaxHeight);

                                    // var ret = domUtil.selector.grid.get(span.id).outerHeight() + descendantsMaxHeight + TYPE_MARGIN_BOTTOM;
                                    var ret = positionUtils.getGrid(span.id).height + descendantsMaxHeight + TYPE_MARGIN_BOTTOM;

                                    // console.log(span.id, 'descendantsMaxHeight', ret);

                                    return ret;
                                };

                                if (span.getTypes().length > 0 && span.children.length > 0) {
                                    var spanPosition = positionUtils.getSpan(span.id);
                                    var descendantsMaxHeight = getHeightIncludeDescendantGrids(span);

                                    domUtil.selector.grid.get(span.id).css({
                                        'top': spanPosition.top - TYPE_MARGIN_BOTTOM - descendantsMaxHeight,
                                    });
                                    // console.log('pull', span.id, spanPosition.top, '-', TYPE_MARGIN_BOTTOM, '-', descendantsMaxHeight, '=', spanPosition.top - TYPE_MARGIN_BOTTOM - descendantsMaxHeight);
                                }
                            };

                            stickGridOnSpan(span);
                            pullUpGridOverDescendants(span);
                        },
                        arrangePositionAll: function() {
                            var arrangePositionGridAndoDescendant = function(span) {
                                // Arrange position All descendants because a grandchild maybe have types when a child has no type. 
                                span.children
                                    .forEach(function(span) {
                                        arrangePositionGridAndoDescendant(span);
                                    });
                                view.renderer.grid.arrangePosition(span);
                            };

                            model.annotationData.spansTopLevel
                                .filter(function(span) {
                                    // There is at least one type in span that has a grid.
                                    return span.getTypes().length > 0;
                                })
                                .forEach(function(span) {
                                    arrangePositionGridAndoDescendant(span);
                                });
                        }
                    },
                    relation: function() {
                        // Init a jsPlumb instance.
                        var jsPlumbInstance = function() {
                            var newInstance = jsPlumb.getInstance({
                                ConnectionsDetachable: false,
                                Endpoint: ['Dot', {
                                    radius: 1
                                }]
                            });
                            newInstance.setRenderMode(newInstance.SVG);
                            newInstance.Defaults.Container = getAnnotationArea();
                            return newInstance;
                        }();

                        var determineCurviness = function(sourceId, targetId) {
                            var sourcePosition = positionUtils.getEntity(sourceId);
                            var targetPosition = positionUtils.getEntity(targetId);

                            var sourceX = sourcePosition.center;
                            var targetX = targetPosition.center;

                            var sourceY = sourcePosition.top;
                            var targetY = targetPosition.top;

                            var xdiff = Math.abs(sourceX - targetX);
                            var ydiff = Math.abs(sourceY - targetY);
                            var curviness = xdiff * view.renderer.relation.settings.xrate + ydiff * view.renderer.relation.settings.yrate + view.renderer.relation.settings.c_offset;
                            curviness /= 2.4;

                            return curviness;
                        };

                        // Set visible connector and their endpoints.
                        var setConnectorVisible = function(isShow) {
                            this.endpoints.forEach(function(endpoint) {
                                endpoint.setVisible(isShow);
                            });
                            this.setVisible(isShow);
                        };

                        return {
                            // Parameters to render relations.
                            settings: {
                                // opacity of connectorsA
                                connOpacity: 0.6,

                                // curviness parameters
                                xrate: 0.6,
                                yrate: 0.05,

                                // curviness offset
                                c_offset: 20,
                            },
                            cachedConnectors: {},
                            reset: function() {
                                jsPlumbInstance.reset();
                                view.renderer.relation.cachedConnectors = {};
                                view.renderer.relation.relationIdsSelected = [];
                            },
                            renderRelation: function(relationId) {
                                var sourceId = model.annotationData.relations[relationId].subj;
                                var targetId = model.annotationData.relations[relationId].obj;

                                //  Determination of anchor points
                                var sourceAnchor, targetAnchor, curviness;
                                if (sourceId == targetId) {
                                    // In case of self-reference
                                    sourceAnchor = [0.5, 0, -1, -1];
                                    targetAnchor = [0.5, 0, 1, -1];
                                    curviness = 30;
                                } else {
                                    sourceAnchor = 'TopCenter';
                                    targetAnchor = 'TopCenter';
                                    curviness = determineCurviness(sourceId, targetId);
                                }

                                // make connector
                                var pred = model.annotationData.relations[relationId].pred;
                                var conn = jsPlumbInstance.connect({
                                    source: domUtil.selector.entity.get(sourceId),
                                    target: domUtil.selector.entity.get(targetId),
                                    anchors: [sourceAnchor, targetAnchor],
                                    connector: ['Bezier', {
                                        curviness: curviness
                                    }],
                                    paintStyle: model.connectorTypes[pred].paintStyle,
                                    hoverPaintStyle: model.connectorTypes[pred].hoverPaintStyle,
                                    parameters: {
                                        'id': relationId,
                                    },
                                    cssClass: 'textae-editor__relation',
                                    overlays: [
                                        ['Arrow', {
                                            width: 10,
                                            length: 12,
                                            location: 1
                                        }],
                                        ['Label', {
                                            label: '[' + relationId + '] ' + pred,
                                            cssClass: 'textae-editor__relation__label'
                                        }]
                                    ]
                                });

                                // Notify to contoroller that a new jsPlumbConnection is added.
                                editor.trigger('textae.editor.jsPlumbConnection.add', conn);

                                // Extend for viewMode.
                                $.extend(conn, {
                                    setConnectorVisible: setConnectorVisible
                                });

                                // Cache a connector instance.
                                view.renderer.relation.cachedConnectors[relationId] = conn;
                                return conn;
                            },
                            destroy: function(relationId) {
                                var c = view.renderer.relation.cachedConnectors[relationId];
                                jsPlumbInstance.detach(c);
                            },
                            arrangePosition: function(relationId) {
                                // recompute curviness
                                var sourceId = model.annotationData.relations[relationId].subj;
                                var targetId = model.annotationData.relations[relationId].obj;
                                var curviness = determineCurviness(sourceId, targetId);

                                if (sourceId == targetId) curviness = 30;

                                var conn = view.renderer.relation.cachedConnectors[relationId];
                                conn.endpoints[0].repaint();
                                conn.endpoints[1].repaint();
                                conn.setConnector(['Bezier', {
                                    curviness: curviness
                                }]);
                                conn.addOverlay(['Arrow', {
                                    width: 10,
                                    length: 12,
                                    location: 1
                                }]);
                            },
                            arrangePositionAll: function() {
                                model.annotationData.getRelationIds()
                                    .forEach(function(relationId) {
                                        view.renderer.relation.arrangePosition(relationId);
                                    });
                            },
                            isRelationSelected: function(relationId) {
                                return (view.renderer.relation.relationIdsSelected.indexOf(relationId) > -1);
                            },
                            selectRelation: function(relationId) {
                                if (!view.renderer.relation.isRelationSelected(relationId)) {
                                    view.renderer.relation.cachedConnectors[relationId].setPaintStyle(model.connectorTypes[model.annotationData.relations[relationId].pred + "_selected"].paintStyle);
                                    view.renderer.relation.relationIdsSelected.push(relationId);
                                }
                            },
                            deselectRelation: function(relationId) {
                                var i = view.renderer.relation.relationIdsSelected.indexOf(relationId);
                                if (i > -1) {
                                    view.renderer.relation.cachedConnectors[relationId].setPaintStyle(model.connectorTypes[model.annotationData.relations[relationId].pred].paintStyle);
                                    view.renderer.relation.relationIdsSelected.splice(i, 1);
                                }
                            },
                            clearRelationSelection: function() {
                                while (view.renderer.relation.relationIdsSelected.length > 0) {
                                    var relationId = view.renderer.relation.relationIdsSelected.pop();
                                    view.renderer.relation.cachedConnectors[relationId].setPaintStyle(model.connectorTypes[model.annotationData.relations[relationId].pred].paintStyle);
                                }
                            },
                        };
                    }(),
                };
            }();

            return {
                init: function() {
                    view.viewModel.buttonStateHelper.init();
                    view.viewModel.viewMode.set('TERM'); // or INSTANCE
                },
                renderer: renderer,
                viewModel: viewModel
            };
        }(this);

        //handle user input event.
        var controller = function(editor) {
            var cancelBubble = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
                e.bubbles = false;
                if (e.stopPropagation) e.stopPropagation();
            };

            var bodyClicked = function(e) {
                var getPosition = function(node) {
                    var $parent = $(node).parent();
                    var parentId = $parent.attr("id");

                    var pos;
                    if ($parent.hasClass("textae-editor__body__text-box__paragraph")) {
                        pos = view.renderer.paragraphs[parentId].begin;
                    } else if ($parent.hasClass("textae-editor__span")) {
                        pos = model.annotationData.getSpan(parentId).begin;
                    } else {
                        console.log(parentId);
                        return;
                    }

                    var childNodes = node.parentElement.childNodes;
                    for (var i = 0; childNodes[i] != node; i++) { // until the focus node
                        pos += (childNodes[i].nodeName == "#text") ? childNodes[i].nodeValue.length : $('#' + childNodes[i].id).text().length;
                    }

                    return pos;
                };

                var getFocusPosition = function(selection) {
                    var pos = getPosition(selection.focusNode);
                    return pos += selection.focusOffset;
                };

                var getAnchorPosition = function(selection) {
                    var pos = getPosition(selection.anchorNode);
                    return pos + selection.anchorOffset;
                };

                // adjust the beginning position of a span
                var adjustSpanBegin = function(beginPosition) {
                    var pos = beginPosition;
                    while (model.spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos))) {
                        pos++;
                    }
                    while (!model.spanConfig.isDelimiter(model.sourceDoc.charAt(pos)) && pos > 0 && !model.spanConfig.isDelimiter(model.sourceDoc.charAt(pos - 1))) {
                        pos--;
                    }
                    return pos;
                };

                // adjust the end position of a span
                var adjustSpanEnd = function(endPosition) {
                    var pos = endPosition;
                    while (model.spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos - 1))) {
                        pos--;
                    }
                    while (!model.spanConfig.isDelimiter(model.sourceDoc.charAt(pos)) && pos < model.sourceDoc.length) {
                        pos++;
                    }
                    return pos;
                };

                // adjust the beginning position of a span for shortening
                var adjustSpanBegin2 = function(beginPosition) {
                    var pos = beginPosition;
                    while ((pos < model.sourceDoc.length) && (model.spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos)) || !model.spanConfig.isDelimiter(model.sourceDoc.charAt(pos - 1)))) {
                        pos++;
                    }
                    return pos;
                };

                // adjust the end position of a span for shortening
                var adjustSpanEnd2 = function(endPosition) {
                    var pos = endPosition;
                    while ((pos > 0) && (model.spanConfig.isNonEdgeCharacter(model.sourceDoc.charAt(pos - 1)) || !model.spanConfig.isDelimiter(model.sourceDoc.charAt(pos)))) {
                        pos--;
                    }
                    return pos;
                };

                var moveSpan = function(spanId, begin, end) {
                    return [controller.command.factory.spanMoveCommand(spanId, begin, end)];
                };

                var expandSpan = function(sid, selection) {
                    var commands = [];

                    var focusPosition = getFocusPosition(selection);

                    var range = selection.getRangeAt(0);
                    var anchorRange = document.createRange();
                    anchorRange.selectNode(selection.anchorNode);

                    if (range.compareBoundaryPoints(Range.START_TO_START, anchorRange) < 0) {
                        // expand to the left
                        var newBegin = adjustSpanBegin(focusPosition);
                        commands = moveSpan(sid, newBegin, model.annotationData.getSpan(sid).end);
                    } else {
                        // expand to the right
                        var newEnd = adjustSpanEnd(focusPosition);
                        commands = moveSpan(sid, model.annotationData.getSpan(sid).begin, newEnd);
                    }

                    controller.command.invoke(commands);
                };

                var shortenSpan = function(sid, selection) {
                    var commands = [];

                    var focusPosition = getFocusPosition(selection);

                    var range = selection.getRangeAt(0);
                    var focusRange = document.createRange();
                    focusRange.selectNode(selection.focusNode);

                    var removeSpan = function(spanId) {
                        return [controller.command.factory.spanRemoveCommand(spanId)];
                    };

                    var new_sid, tid, eid, type;
                    if (range.compareBoundaryPoints(Range.START_TO_START, focusRange) > 0) {
                        // shorten the right boundary
                        var newEnd = adjustSpanEnd2(focusPosition);

                        if (newEnd > model.annotationData.getSpan(sid).begin) {
                            new_sid = idFactory.makeSpanId(model.annotationData.getSpan(sid).begin, newEnd);
                            if (model.annotationData.getSpan(new_sid)) {
                                commands = removeSpan(sid);
                            } else {
                                commands = moveSpan(sid, model.annotationData.getSpan(sid).begin, newEnd);
                            }
                        } else {
                            domUtil.selector.span.select(sid);
                            controller.userEvent.editHandler.removeSelectedElements();
                        }
                    } else {
                        // shorten the left boundary
                        var newBegin = adjustSpanBegin2(focusPosition);

                        if (newBegin < model.annotationData.getSpan(sid).end) {
                            new_sid = idFactory.makeSpanId(newBegin, model.annotationData.getSpan(sid).end);
                            if (model.annotationData.getSpan(new_sid)) {
                                commands = removeSpan(sid);
                            } else {
                                commands = moveSpan(sid, newBegin, model.annotationData.getSpan(sid).end);
                            }
                        } else {
                            domUtil.selector.span.select(sid);
                            controller.userEvent.editHandler.removeSelectedElements();
                        }
                    }

                    controller.command.invoke(commands);
                };

                var selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    var range = selection.getRangeAt(0);

                    if (
                        // when the whole div is selected by e.g., triple click
                        (range.startContainer == view.renderer.helper.getSourceDocArea().get(0)) ||
                        // when Shift is pressed
                        (e.shiftKey) ||
                        // when nothing is selected
                        (selection.isCollapsed)
                    ) {
                        // bubbles go up
                        controller.userEvent.viewHandler.cancelSelect();
                        domUtil.manipulate.dismissBrowserSelection();
                        return true;
                    }

                    var anchorPosition = getAnchorPosition(selection);
                    var focusPosition = getFocusPosition(selection);

                    // no boundary crossing: normal -> create a entity
                    var sid;
                    if (selection.anchorNode.parentElement.id === selection.focusNode.parentElement.id) {
                        domUtil.manipulate.unselect();

                        // switch the position when the selection is made from right to left
                        if (anchorPosition > focusPosition) {
                            var tmpPos = anchorPosition;
                            anchorPosition = focusPosition;
                            focusPosition = tmpPos;
                        }

                        // when the whole text is selected by e.g., triple click (Chrome)
                        if ((anchorPosition === 0) && (focusPosition == model.sourceDoc.length)) {
                            // do nothing. bubbles go up
                            return true;
                        }

                        var beginPosition = adjustSpanBegin(anchorPosition);
                        var endPosition = adjustSpanEnd(focusPosition);
                        sid = idFactory.makeSpanId(beginPosition, endPosition);

                        if (!model.annotationData.getSpan(sid)) {
                            if (endPosition - beginPosition > CONSTS.BLOCK_THRESHOLD) {
                                controller.command.invoke([controller.command.factory.spanCreateCommand({
                                    begin: beginPosition,
                                    end: endPosition
                                })]);
                            } else {
                                var commands = [controller.command.factory.spanCreateCommand({
                                    begin: beginPosition,
                                    end: endPosition
                                })];

                                if (view.viewModel.isReplicateAuto) {
                                    var replicates = controller.command.factory.spanReplicateCommand({
                                        begin: beginPosition,
                                        end: endPosition
                                    });
                                    commands.push(replicates);
                                }
                                controller.command.invoke(commands);
                            }
                        }
                    }

                    // boundary crossing: exception
                    else {
                        if (selection.anchorNode.parentNode.parentNode == selection.focusNode.parentNode) {
                            domUtil.manipulate.unselect();
                            expandSpan(selection.anchorNode.parentNode.id, selection);
                        } else if (selection.anchorNode.parentNode == selection.focusNode.parentNode.parentNode) {
                            domUtil.manipulate.unselect();
                            shortenSpan(selection.focusNode.parentNode.id, selection);
                        } else if (domUtil.selector.span.getNumberOfSelected() == 1) {
                            sid = domUtil.selector.span.popSelectedId();

                            // drag began inside the selected span (expansion)
                            if ((anchorPosition > model.annotationData.getSpan(sid).begin) && (anchorPosition < model.annotationData.getSpan(sid).end)) {
                                // The focus node should be at one level above the selected node.
                                if (domUtil.selector.span.get(sid).get(0).parentNode.id == selection.focusNode.parentNode.id) expandSpan(sid, selection);
                                else {
                                    domUtil.selector.span.select(sid);
                                    alert('A span cannot be expanded to make a boundary crossing.');
                                }
                            }

                            // drag ended inside the selected span (shortening)
                            else if ((focusPosition > model.annotationData.getSpan(sid).begin) && (focusPosition < model.annotationData.getSpan(sid).end)) {
                                if (domUtil.selector.span.get(sid).get(0).id == selection.focusNode.parentNode.id) shortenSpan(sid, selection);
                                else {
                                    domUtil.selector.span.select(sid);
                                    alert('A span cannot be shrinked to make a boundary crossing.');
                                }
                            } else alert('It is ambiguous for which span you want to adjust the boundary. Reselect the span, and try again.');
                        } else {
                            alert('It is ambiguous for which span you want to adjust the boundary. Select the span, and try again.');
                        }
                    }
                }

                domUtil.manipulate.dismissBrowserSelection();
                cancelBubble(e);
            };

            var spanClicked = function(e) {
                controller.userEvent.viewHandler.hidePallet();
                var selection = window.getSelection();
                var range = selection.getRangeAt(0);

                if (!selection.isCollapsed) {
                    if (e.shiftKey && domUtil.selector.span.getNumberOfSelected() == 1) {
                        //select reange of spans.
                        var firstId = domUtil.selector.span.popSelectedId();
                        var secondId = $(this).attr('id');

                        domUtil.manipulate.dismissBrowserSelection();
                        domUtil.manipulate.unselect();

                        model.annotationData.getRangeOfSpan(firstId, secondId).forEach(function(spanId) {
                            domUtil.selector.span.select(spanId);
                        });

                    } else {
                        // if drag, bubble up
                        return true;
                    }
                } else if (e.ctrlKey) {
                    domUtil.manipulate.toggle(e.target);
                } else {
                    domUtil.manipulate.selectOnly(e.target);
                }

                return false;
            };

            var entitiesClicked = function(ctrlKey, $typeLabel, $entities) {
                var $targets = $typeLabel.add($entities);
                if (ctrlKey) {
                    if ($typeLabel.hasClass('ui-selected')) {
                        domUtil.manipulate.deselect($targets);
                    } else {
                        domUtil.manipulate.select($targets);
                    }
                } else {
                    domUtil.manipulate.selectOnly($targets);
                }
                return false;
            };

            var typeLabelClicked = function(e) {
                var $typeLabel = $(e.target);
                return entitiesClicked(e.ctrlKey, $typeLabel, $typeLabel.next().children());
            };

            var entityPaneClicked = function(e) {
                var $typePane = $(e.target);
                return entitiesClicked(e.ctrlKey, $typePane.prev(), $typePane.children());
            };

            var entityClicked = function(e) {
                if (e.ctrlKey) {
                    domUtil.manipulate.toggle(e.target);
                } else {
                    var $typePane = $(e.target).parent();

                    if ($typePane.children().length === 1) {
                        // Select the typeLabel if only one entity is selected.
                        domUtil.manipulate.selectOnly($typePane.prev().add($typePane.children()));
                    } else {
                        domUtil.manipulate.selectOnly(e.target);
                    }
                }
                return false;
            };

            var spanSelectChanged = function(e, isSelected) {
                view.viewModel.buttonStateHelper.updateBySpan();
            };

            var entitySelectChanged = function(e, isSelected) {
                var $typePane = $(e.target).parent();

                // Select the typeLabel if all entities is selected.
                if ($typePane.children().length === $typePane.find('.ui-selected').length) {
                    domUtil.manipulate.select($typePane.prev());
                } else {
                    domUtil.manipulate.deselect($typePane.prev());
                }

                view.viewModel.buttonStateHelper.updateByEntity();
            };

            // A relation is drawn by a jsPlumbConnection.
            var jsPlumbConnectionClicked = function(jsPlumbConnection, event) {
                var relationId = jsPlumbConnection.getParameter("id");

                domUtil.manipulate.unselect();

                if (view.renderer.relation.isRelationSelected(relationId)) {
                    view.renderer.relation.deselectRelation(relationId);
                } else {
                    if (!event.ctrlKey) {
                        view.renderer.relation.clearRelationSelection();
                    }
                    view.renderer.relation.selectRelation(relationId);
                }

                cancelBubble(event);
                return false;
            };

            var editorSelected = function() {
                editor.tool.selectMe();
                view.viewModel.buttonStateHelper.renderEnable();
            };

            // A command is an operation by user that is saved as history, and can undo and redo.
            // Users can edit model only via commands. 
            var command = function() {
                // histories of edit to undo and redo.
                var history = function() {
                    var lastSaveIndex = -1,
                        lastEditIndex = -1,
                        history = [],
                        onChangeFunc,
                        trigger = function() {
                            if (onChangeFunc) {
                                onChangeFunc();
                            }
                        };

                    return {
                        init: function(onChange) {
                            if (onChange !== undefined) {
                                onChangeFunc = onChange.bind(this);
                            }
                        },
                        reset: function() {
                            lastSaveIndex = -1;
                            lastEditIndex = -1;
                            history = [];
                            trigger();
                        },
                        push: function(commands) {
                            history.splice(lastEditIndex + 1, history.length - lastEditIndex, commands);
                            lastEditIndex++;
                            trigger();
                        },
                        next: function() {
                            lastEditIndex++;
                            trigger();
                            return history[lastEditIndex];
                        },
                        prev: function() {
                            var lastEdit = history[lastEditIndex];
                            lastEditIndex--;
                            trigger();
                            return lastEdit;
                        },
                        saved: function() {
                            lastSaveIndex = lastEditIndex;
                            trigger();
                        },
                        hasAnythingToUndo: function() {
                            return lastEditIndex > -1;
                        },
                        hasAnythingToRedo: function() {
                            return lastEditIndex < history.length - 1;
                        },
                        hasAnythingToSave: function() {
                            return lastEditIndex != lastSaveIndex;
                        }
                    };
                }();

                var invoke = function(commands) {
                    commands.forEach(function(command) {
                        command.execute();
                    });

                    view.renderer.helper.redraw();
                };

                return {
                    init: function(onChange) {
                        history.init(onChange);
                        history.reset();
                    },
                    reset: function(annotation) {
                        model.reset(annotation);
                        history.reset();
                        view.renderer.reset();
                    },
                    updateSavePoint: function() {
                        history.saved();
                    },
                    invoke: function(commands) {
                        if (commands && commands.length > 0) {
                            invoke(commands);
                            history.push(commands);
                        }
                    },
                    undo: function() {
                        var getRevertCommands = function(commands) {
                            commands = Object.create(commands);
                            commands.reverse();
                            return commands.map(function(originCommand) {
                                return originCommand.revert();
                            });
                        };

                        if (history.hasAnythingToUndo()) {
                            domUtil.manipulate.unselect();
                            view.renderer.relation.clearRelationSelection();
                            invoke(getRevertCommands(history.prev()));
                        }
                    },
                    redo: function() {
                        if (history.hasAnythingToRedo()) {
                            domUtil.manipulate.unselect();
                            view.renderer.relation.clearRelationSelection();
                            invoke(history.next());
                        }
                    },
                    factory: function() {
                        var debugLog = function(message) {
                            // For debug
                            console.log('[controller.command.invoke]', message);
                        };

                        return {
                            spanCreateCommand: function(newSpan) {
                                var id = idFactory.makeSpanId(newSpan.begin, newSpan.end);
                                return {
                                    execute: function() {
                                        try {
                                            // model
                                            model.annotationData.addSpan({
                                                begin: newSpan.begin,
                                                end: newSpan.end
                                            });

                                            // rendering
                                            view.renderer.span.render(id);

                                            // select
                                            domUtil.selector.span.select(id);

                                            debugLog('create a new span, spanId:' + id);
                                        } catch (e) {
                                            // Rollback model data unless dom create.
                                            model.annotationData.removeSpan(id);
                                            throw e;
                                        }
                                    },
                                    revert: controller.command.factory.spanRemoveCommand.bind(null, id),
                                };
                            },
                            spanRemoveCommand: function(spanId) {
                                var span = model.annotationData.getSpan(spanId);
                                return {
                                    execute: function() {
                                        // Save a span potision for undo
                                        this.begin = span.begin;
                                        this.end = span.end;
                                        // model
                                        model.annotationData.removeSpan(spanId);
                                        // rendering
                                        view.renderer.span.destroy(spanId);

                                        debugLog('remove a span, spanId:' + spanId);
                                    },
                                    revert: controller.command.factory.spanCreateCommand.bind(null, {
                                        begin: span.begin,
                                        end: span.end
                                    })
                                };
                            },
                            spanMoveCommand: function(spanId, begin, end) {
                                var commands = [];
                                var newSpanId = idFactory.makeSpanId(begin, end);
                                if (!model.annotationData.getSpan(newSpanId)) {
                                    commands.push(controller.command.factory.spanRemoveCommand(spanId));
                                    commands.push(controller.command.factory.spanCreateCommand({
                                        begin: begin,
                                        end: end
                                    }));
                                    model.annotationData.getSpan(spanId).getTypes().forEach(function(type) {
                                        type.entities.forEach(function(entityId) {
                                            commands.push(controller.command.factory.entityCreateCommand(newSpanId, type.name, entityId));
                                        });
                                    });
                                }
                                var oldBeginEnd = idFactory.parseSpanId(spanId);

                                return {
                                    execute: function() {
                                        commands.forEach(function(command) {
                                            command.execute();
                                        });
                                        debugLog('move a span, spanId:' + spanId + ', newBegin:' + begin + ', newEnd:' + end);
                                    },
                                    revert: controller.command.factory.spanMoveCommand.bind(null, newSpanId, oldBeginEnd.begin, oldBeginEnd.end),
                                };
                            },
                            spanReplicateCommand: function(span) {
                                var commands = model.getReplicationSpans(span)
                                    .map(controller.command.factory.spanCreateCommand);

                                return {
                                    execute: function() {
                                        commands.forEach(function(command) {
                                            command.execute();
                                        });
                                        debugLog('replicate a span, begin:' + span.begin + ', end:' + span.end);
                                    },
                                    revert: function() {
                                        var revertedCommands = commands.map(function(command) {
                                            return command.revert();
                                        });
                                        return {
                                            execute: function() {
                                                revertedCommands.forEach(function(command) {
                                                    command.execute();
                                                });
                                                debugLog('revert replicate a span, begin:' + span.begin + ', end:' + span.end);
                                            }
                                        };
                                    }
                                };
                            },
                            entityCreateCommand: function(spanId, typeName, entityId) {
                                return {
                                    execute: function() {
                                        // Overwrite to revert
                                        entityId = entityId || model.annotationData.getNewEntityId();
                                        // model
                                        var newEntity = {
                                            id: entityId,
                                            span: spanId,
                                            type: typeName
                                        };
                                        model.annotationData.addEntity(newEntity);
                                        // rendering
                                        view.renderer.entity.render(newEntity);
                                        // select
                                        domUtil.selector.entity.select(entityId);

                                        debugLog('create a new entity, spanId:' + spanId + ', type:' + typeName + '  entityId:' + entityId);
                                    },
                                    revert: function() {
                                        // This function cannot be bound, because a new entity id is created at execute.
                                        return controller.command.factory.entityRemoveCommand(entityId, spanId, typeName);
                                    }
                                };
                            },
                            entityRemoveCommand: function(entityId, spanId, typeName) {
                                // The spanId and typeName of exist entity are neccesary to revert.
                                // The spanId and typeName are specified when this function is called from revert of createEntityCommand.
                                // Because a new entity is not exist yet.
                                var entity = model.annotationData.entities[entityId];
                                return {
                                    execute: function() {
                                        // model
                                        var deleteEntity = model.annotationData.removeEnitity(entityId);
                                        // rendering
                                        view.renderer.entity.destroy(deleteEntity);

                                        debugLog('remove a entity, spanId:' + entity.span + ', type:' + entity.type + ', entityId:' + entityId);
                                    },
                                    revert: controller.command.factory.entityCreateCommand.bind(null, spanId || entity.span, typeName || entity.type, entityId)
                                };
                            },
                            entityChangeTypeCommand: function(entityId, newType) {
                                return {
                                    execute: function() {
                                        var changedEntity = model.annotationData.removeEnitity(entityId);
                                        var oldType = changedEntity.type;
                                        changedEntity.type = newType;
                                        model.annotationData.addEntity(changedEntity);
                                        // rendering
                                        view.renderer.entity.changeTypeOfExists(changedEntity);

                                        debugLog('change type of a entity, spanId:' + changedEntity.span + ', type:' + oldType + ', entityId:' + entityId + ', newType:' + newType);
                                    },
                                    revert: controller.command.factory.entityChangeTypeCommand.bind(null, entityId, model.annotationData.entities[entityId].type)
                                };
                            },
                            relationCreateCommand: function(relationId, subject, object, predicate) {
                                return {
                                    execute: function() {
                                        model.annotationData.relations[relationId] = {
                                            id: relationId,
                                            subj: subject,
                                            obj: object,
                                            pred: predicate
                                        };

                                        if (model.relationsPerEntity[subject]) {
                                            if (model.relationsPerEntity[subject].indexOf(relationId) < 0) {
                                                model.relationsPerEntity[subject].push(relationId);
                                            }
                                        } else {
                                            model.relationsPerEntity[subject] = [relationId];
                                        }

                                        if (model.relationsPerEntity[object]) {
                                            if (model.relationsPerEntity[object].indexOf(relationId) < 0) {
                                                model.relationsPerEntity[object].push(relationId);
                                            }
                                        } else {
                                            model.relationsPerEntity[object] = [relationId];
                                        }

                                        // rendering
                                        view.renderer.relation.render(relationId);

                                        // selection
                                        view.renderer.relation.selectRelation(relationId);

                                        debugLog('create a new relation relationId:' + relationId + ', subject:' + subject + ', object:' + object + ', predicate:' + predicate);
                                    },
                                    revert: controller.command.factory.relationRemoveCommand.bind(null, relationId)
                                };
                            },
                            relationRemoveCommand: function(relationId) {
                                var relation = model.annotationData.relations[relationId];
                                var subject = relation.subj;
                                var object = relation.obj;
                                var predicate = relation.pred;

                                return {
                                    execute: function() {
                                        // model
                                        delete model.annotationData.relations[relationId];

                                        console.log('before remove relation', model.relationsPerEntity);

                                        var relatinosOfSubject = model.relationsPerEntity[subject];
                                        relatinosOfSubject.splice(relatinosOfSubject.indexOf(relationId), 1);
                                        if (relatinosOfSubject.length === 0) {
                                            delete model.relationsPerEntity[subject];
                                        }
                                        var relatinosOfObject = model.relationsPerEntity[object];
                                        relatinosOfObject.splice(relatinosOfObject.indexOf(relationId), 1);
                                        if (relatinosOfObject.length === 0) {
                                            delete model.relationsPerEntity[object];
                                        }

                                        // rendering
                                        view.renderer.relation.destroy(relationId);

                                        debugLog('remove a relation relationId:' + relationId + ', subject:' + subject + ', object:' + object + ', predicate:' + predicate);
                                    },
                                    revert: controller.command.factory.relationCreateCommand.bind(null, relationId, subject, object, predicate)
                                };
                            },
                            relationChangePredicateCommand: function(relationId, predicate) {
                                var oldPredicate = model.annotationData.relations[relationId].pred;
                                return {
                                    execute: function() {
                                        // model
                                        model.annotationData.relations[relationId].pred = predicate;
                                        // rendering
                                        view.renderer.relation.cachedConnectors[relationId].setPaintStyle(model.connectorTypes[predicate + "_selected"].paintStyle);
                                        view.renderer.relation.cachedConnectors[relationId].setHoverPaintStyle(model.connectorTypes[predicate + "_selected"].hoverPaintStyle);
                                        view.renderer.relation.cachedConnectors[relationId].setLabel('[' + relationId + '] ' + predicate);
                                        // selection
                                        view.renderer.relation.selectRelation(relationId);
                                    },
                                    revert: controller.command.factory.relationChangePredicateCommand.bind(null, relationId, oldPredicate)
                                };
                            },
                            //TODO: relationChangeSubjectCommand, relationChangeObjectCommand
                        };
                    }(),
                };
            }();

            var userEvent = {
                // User event to edit model
                editHandler: function() {
                    var changeTypeOfSelectedEntities = function(newType) {
                        var $selectedEntities = domUtil.selector.entity.getSelecteds();
                        if ($selectedEntities.length > 0) {

                            var commands = [];
                            $selectedEntities.each(function() {
                                commands.push(controller.command.factory.entityChangeTypeCommand(this.title, newType));
                            });

                            controller.command.invoke(commands);
                        }
                    };

                    return {
                        replicate: function() {
                            if (domUtil.selector.span.getNumberOfSelected() === 1) {
                                controller.command.invoke([controller.command.factory.spanReplicateCommand(model.annotationData.getSpan(domUtil.selector.span.getSelectedId()))]);
                            } else {
                                alert('You can replicate span annotation when there is only span selected.');
                            }
                        },
                        createEntity: function() {
                            var commands = [];
                            domUtil.selector.span.getSelecteds().each(function() {
                                commands.push(controller.command.factory.entityCreateCommand(this.id, model.entityTypes.getDefaultType()));
                            });

                            controller.command.invoke(commands);
                        },
                        // set the type of an entity
                        setEntityType: function() {
                            var newType = $(this).attr('label');
                            changeTypeOfSelectedEntities(newType);
                            return false;
                        },
                        newLabel: function() {
                            if (!domUtil.selector.entity.hasSelecteds()) {
                                return;
                            }

                            var newTypeLabel = prompt("Please enter a new label", "");
                            if (newTypeLabel) {
                                changeTypeOfSelectedEntities(newTypeLabel);
                            }
                        },
                        removeSelectedElements: function() {
                            var removeCommand = function() {
                                var unique = function(array) {
                                    var hash = {};
                                    array.forEach(function(element) {
                                        hash[element] = null;
                                    });
                                    return Object.keys(hash);
                                };

                                var spanIds = [],
                                    entityIds = [],
                                    relationIds = [];
                                return {
                                    addSpanId: function(spanId) {
                                        spanIds.push(spanId);
                                    },
                                    addEntityId: function(entityId) {
                                        entityIds.push(entityId);
                                    },
                                    addRelations: function(addedRelations) {
                                        Array.prototype.push.apply(relationIds, addedRelations);
                                    },
                                    getAll: function() {
                                        return unique(relationIds).map(controller.command.factory.relationRemoveCommand)
                                            .concat(
                                                unique(entityIds).map(function(entity) {
                                                    // Wrap by a anonymous function, because controller.command.factory.entityRemoveCommand has two optional arguments.
                                                    return controller.command.factory.entityRemoveCommand(entity);
                                                }),
                                                unique(spanIds).map(controller.command.factory.spanRemoveCommand));
                                    },
                                };
                            }();

                            var removeEnitity = function(entityId) {
                                removeCommand.addEntityId(entityId);
                                if (model.relationsPerEntity[entityId]) {
                                    removeCommand.addRelations(model.relationsPerEntity[entityId]);
                                }
                            };

                            //remove spans
                            domUtil.selector.span.getSelecteds().each(function() {
                                var spanId = this.id;
                                removeCommand.addSpanId(spanId);

                                model.annotationData.getSpan(spanId).getTypes().forEach(function(type) {
                                    type.entities.forEach(function(entityId) {
                                        removeEnitity(entityId);
                                    });
                                });
                            });

                            //remove entities
                            domUtil.selector.entity.getSelecteds().each(function() {
                                //an entity element has the entityId in title. an id is per Editor.
                                removeEnitity(this.title);
                            });

                            //remove relations
                            removeCommand.addRelations(view.renderer.relation.relationIdsSelected);
                            view.renderer.relation.relationIdsSelected = [];

                            controller.command.invoke(removeCommand.getAll());
                        },
                        copyEntities: function() {
                            view.viewModel.clipBoard = function getEntitiesFromSelectedSpan() {
                                return domUtil.selector.span.getSelecteds().map(function() {
                                    return model.annotationData.getSpan(this.id).getTypes().map(function(t) {
                                        return t.entities;
                                    }).reduce(function(a, b) {
                                        return a.concat(b);
                                    });
                                }).get();
                            }().concat(
                                function getSelectedEntities() {
                                    return domUtil.selector.entity.getSelecteds().map(function() {
                                        return $(this).attr('title');
                                    }).get();
                                }()
                            ).reduce(function(p, c) {
                                // Unique Entities. Because a entity is deplicate When a span and thats entity is selected.
                                if (p.indexOf(c) < 0) {
                                    p.push(c);
                                }
                                return p;
                            }, []);
                        },
                        pasteEntities: function() {
                            // Make commands per selected spans from entities in clipBord. 
                            var commands = domUtil.selector.span.getSelecteds().map(function() {
                                var spanId = this.id;
                                // The view.viewModel.clipBoard has enitityIds.
                                return view.viewModel.clipBoard.map(function(entityId) {
                                    return controller.command.factory.entityCreateCommand(spanId, model.annotationData.entities[entityId].type);
                                });
                            }).get();

                            controller.command.invoke(commands);
                        },
                        // Set the default type of denoting object
                        setEntityTypeDefault: function() {
                            model.entityTypes.setDefaultType($(this).attr('label'));
                            return false;
                        },
                    };
                }(),
                // User event that does not change data.
                viewHandler: function(self) {
                    return {
                        showPallet: function(point) {
                            // Create table contents per entity type.
                            var makeTableRowOFEntityPallet = function() {
                                return model.entityTypes.getSortedNames().map(function(typeName) {
                                    var type = model.entityTypes.getType(typeName);

                                    var $column1 = $('<td>').append(function() {
                                        var $radioButton = $('<input>').addClass('textae-editor__entity-pallet__entity-type__radio').attr({
                                            'type': 'radio',
                                            'name': 'etype',
                                            'label': typeName
                                        });
                                        // Select the radio button if it is default type.
                                        if (typeName === model.entityTypes.getDefaultType()) {
                                            $radioButton.attr({
                                                'title': 'default type',
                                                'checked': 'checked'
                                            });
                                        }
                                        return $radioButton;
                                    }());

                                    var $column2 = $('<td>')
                                        .addClass('textae-editor__entity-pallet__entity-type__label')
                                        .attr('label', typeName)
                                        .text(typeName);

                                    var $column3 = $('<td>');
                                    if (type.uri) {
                                        $column3.append($('<a>')
                                            .attr({
                                                'href': type.uri,
                                                'target': '_blank'
                                            })
                                            .append('<img src="images/link.png"/>')
                                        );
                                    }

                                    return $('<tr>')
                                        .addClass('textae-editor__entity-pallet__entity-type')
                                        .css({
                                            'background-color': type.getColor()
                                        })
                                        .append([$column1, $column2, $column3]);
                                });
                            };

                            // Return the pallet. It will be created unless exists.
                            var getEmptyPallet = function() {
                                var $pallet = $('.textae-editor__entity-pallet');
                                if ($pallet.length === 0) {
                                    //setup new pallet
                                    $pallet = $('<div>')
                                        .addClass("textae-editor__entity-pallet")
                                        .append($('<table>'))
                                        .css('position', 'fixed')
                                        .on('mouseup', '.textae-edtior__entity-pallet__entity-type__radio', controller.userEvent.editHandler.setEntityTypeDefault)
                                        .on('click', '.textae-editor__entity-pallet__entity-type__label', function() {
                                            controller.userEvent.viewHandler.hidePallet();
                                            controller.userEvent.editHandler.setEntityType.call(this);
                                        })
                                        .hide();

                                    // Append the pallet to body to show on top.
                                    $("body").append($pallet);
                                } else {
                                    $pallet.find('table').empty();
                                    $pallet.css('width', 'auto');
                                }
                                return $pallet;
                            };

                            var $pallet　 = getEmptyPallet();

                            // Make all rows per show to show new entity type too.
                            $pallet.find("table")
                                .append(makeTableRowOFEntityPallet(model.entityTypes));

                            // Show the scrollbar-y if the height of the pallet is same witch max-height.
                            if ($pallet.outerHeight() + 'px' === $pallet.css('max-height')) {
                                $pallet.css('overflow-y', 'scroll');
                            } else {
                                $pallet.css('overflow-y', '');
                            }

                            // Move the pallet to mouse if it is opened by mouseEvent.
                            if (arguments.length === 1) {
                                $pallet.css({
                                    'top': point.top,
                                    'left': point.left
                                });
                            } else {
                                $pallet.css({
                                    'top': 10,
                                    'left': 20
                                });
                            }
                            $pallet.show();
                        },
                        hidePallet: function() {
                            $('.textae-editor__entity-pallet').hide();
                        },
                        redraw: function() {
                            view.renderer.helper.redraw();
                        },
                        cancelSelect: function() {
                            // if drag, bubble up
                            if (!window.getSelection().isCollapsed) {
                                domUtil.manipulate.dismissBrowserSelection();
                                return true;
                            }

                            domUtil.manipulate.unselect();
                            controller.userEvent.viewHandler.hidePallet();

                            editor.tool.cancelSelect();
                        },
                        selectLeftSpan: function() {
                            if (domUtil.selector.span.getNumberOfSelected() == 1) {
                                var span = model.annotationData.getSpan(domUtil.selector.span.popSelectedId());
                                domUtil.manipulate.unselect();
                                if (span.left) {
                                    domUtil.selector.span.select(span.left.id);
                                }
                            }
                        },
                        selectRightSpan: function() {
                            if (domUtil.selector.span.getNumberOfSelected() == 1) {

                                var span = model.annotationData.getSpan(domUtil.selector.span.popSelectedId());
                                domUtil.manipulate.unselect();
                                if (span.right) {
                                    domUtil.selector.span.select(span.right.id);
                                }
                            }
                        },
                        showSettingDialog: function() {
                            var $content = $('<div>')
                                .addClass('textae-editor__setting-dialog');

                            // Line Height
                            $content
                                .append($('<div>')
                                    .append('<label>Line Height:')
                                    .append($('<input>')
                                        .attr({
                                            'type': 'number',
                                            'step': 1,
                                            'min': 3,
                                            'max': 10,
                                            'value': 4,
                                        })
                                        .addClass('textae-editor__setting-dialog__line-height')
                                    ))
                                .on('change', '.textae-editor__setting-dialog__line-height', function() {
                                    var value = $(this).val();
                                    controller.userEvent.viewHandler.changeLineHeight(value);
                                });

                            // Instance/Relation View
                            var $checkbox = $('<input>')
                                .attr({
                                    'type': 'checkbox'
                                })
                                .addClass('textae-editor__setting-dialog__term-centric-view');
                            if (view.viewModel.viewMode.get() === 'INSTANCE') {
                                $checkbox.attr({
                                    'checked': 'checked'
                                });
                            }

                            $content
                                .append($('<div>')
                                    .append('<label>Instance/Relation View:')
                                    .append($checkbox)
                            )
                                .on('click', '.textae-editor__setting-dialog__term-centric-view', function() {
                                    if ($(this).is(':checked')) {
                                        view.viewModel.viewMode.set('INSTANCE');
                                    } else {
                                        view.viewModel.viewMode.set('TERM');
                                    }
                                    view.renderer.helper.redraw();
                                });

                            // Open the dialog.                        
                            textAeUtil.getDialog(self.editorId, 'textae.dialog.setting', 'Chage Settings', $content, true).open();
                        },
                        changeLineHeight: function(heightValue) {
                            view.renderer.helper.changeLineHeight(heightValue);
                            view.renderer.helper.redraw();
                        },
                    };
                }(this)
            };

            return {
                init: function() {
                    // Bind user input event to handler
                    editor
                        .on('mouseup', '.textae-editor__body', bodyClicked)
                        .on('mouseup', '.textae-editor__span', spanClicked)
                        .on('mouseup', '.textae-editor__type-label', typeLabelClicked)
                        .on('mouseup', '.textae-editor__entity-pane', entityPaneClicked)
                        .on('mouseup', '.textae-editor__entity', entityClicked)
                        .on('mouseup', '.textae-editor__body,.textae-editor__span,.textae-editor__grid,.textae-editor__entity', editorSelected)
                        .on('selectChanged', '.textae-editor__span', spanSelectChanged)
                        .on('selectChanged', '.textae-editor__entity', entitySelectChanged);

                    // The jsPlumbConnetion has an original event mecanism.
                    // We can only bind the connection directory.
                    editor
                        .on('textae.editor.jsPlumbConnection.add', function(event, jsPlumbConnection) {
                            jsPlumbConnection.bind('click', jsPlumbConnectionClicked);
                        });

                    // Init command
                    controller.command.init(
                        function commandChangedHandler() {
                            // An event handler called when command state is changed.

                            //change button state
                            view.viewModel.buttonStateHelper.enabled("write", this.hasAnythingToSave());
                            view.viewModel.buttonStateHelper.enabled("undo", this.hasAnythingToUndo());
                            view.viewModel.buttonStateHelper.enabled("redo", this.hasAnythingToRedo());

                            //change leaveMessage show
                            if (this.hasAnythingToSave()) {
                                window.onbeforeunload = function() {
                                    return "There is a change that has not been saved. If you leave now, you will lose it.";
                                };
                            } else {
                                window.onbeforeunload = null;
                            }
                        }
                    );
                },
                command: command,
                userEvent: userEvent,
            };
        }(this);

        // public funcitons of editor
        this.api = {
            start: function startEdit() {
                controller.init();
                view.init();
                model.init();
            },
            handleKeyInput: function(key) {
                var keyApiMap = {
                    'A': dataAccessObject.showAccess,
                    'C': controller.userEvent.editHandler.copyEntities,
                    'D': controller.userEvent.editHandler.removeSelectedElements,
                    'DEL': controller.userEvent.editHandler.removeSelectedElements,
                    'E': controller.userEvent.editHandler.createEntity,
                    'Q': controller.userEvent.viewHandler.showPallet,
                    'R': controller.userEvent.editHandler.replicate,
                    'S': dataAccessObject.showSave,
                    'V': controller.userEvent.editHandler.pasteEntities,
                    'W': controller.userEvent.editHandler.newLabel,
                    'X': controller.command.redo,
                    'Y': controller.command.redo,
                    'Z': controller.command.undo,
                    'ESC': controller.userEvent.viewHandler.cancelSelect,
                    'LEFT': controller.userEvent.viewHandler.selectLeftSpan,
                    'RIGHT': controller.userEvent.viewHandler.selectRightSpan,
                };
                if (keyApiMap[key]) {
                    keyApiMap[key]();
                }
            },
            handleButtonClick: function(event) {
                var buttonApiMap = {
                    'textae.control.button.read.click': dataAccessObject.showAccess,
                    'textae.control.button.write.click': dataAccessObject.showSave,
                    'textae.control.button.undo.click': controller.command.undo,
                    'textae.control.button.redo.click': controller.command.redo,
                    'textae.control.button.replicate.click': controller.userEvent.editHandler.replicate,
                    'textae.control.button.replicate_auto.click': view.viewModel.toggleReplicateAuto,
                    'textae.control.button.entity.click': controller.userEvent.editHandler.createEntity,
                    'textae.control.button.change_label.click': controller.userEvent.editHandler.newLabel,
                    'textae.control.button.pallet.click': function() {
                        controller.userEvent.viewHandler.showPallet(event.point);
                    },
                    'textae.control.button.delete.click': controller.userEvent.editHandler.removeSelectedElements,
                    'textae.control.button.copy.click': controller.userEvent.editHandler.copyEntities,
                    'textae.control.button.paste.click': controller.userEvent.editHandler.pasteEntities,
                    'textae.control.button.setting.click': controller.userEvent.viewHandler.showSettingDialog,
                };
                buttonApiMap[event.name]();
            },
            redraw: controller.userEvent.viewHandler.redraw,
        };

        return this;
    };
    // The contorol is a contorl bar to edit.
    // This can controls mulitple instace of editor.
    var control = function() {
        // Utility functions to change appearance of bunttons.
        var buttonAppearanceUtil = {
            enable: function($button) {
                $button.removeClass('textae-control__icon--disabled');
            },
            disable: function($button) {
                $button.addClass('textae-control__icon--disabled');
            },
            isDisable: function($button) {
                return $button.hasClass('textae-control__icon--disabled');
            },
            push: function($button) {
                $button.addClass('textae-control__icon--pushed');
            },
            unpush: function($button) {
                $button.removeClass('textae-control__icon--pushed');
            },
            isPushed: function($button) {
                return $button.hasClass('textae-control__icon--pushed');
            }
        };

        // Make dom element.
        var buildElement = function($self) {
            var makeTitle = function() {
                return $('<span>')
                    .addClass('textae-control__title')
                    .append($('<a>')
                        .attr('href', 'http://bionlp.dbcls.jp/textae/')
                        .text('TextAE'));
            };
            var makeIconBar = function() {
                var btn = function(buttonType, title) {
                    var $button = $('<span>')
                        .addClass('textae-control__icon')
                        .addClass('textae-control__' + buttonType + '-button')
                        .attr('title', title);

                    buttonCache[buttonType] = {
                        instance: $button,
                        eventName: 'textae.control.button.' + buttonType.replace(/-/g, '_') + '.click'
                    };
                    return $button;
                };

                // Make a group of buttons that is headed by the separator. 
                var btnGroup = function(params) {
                    var group = [$('<span>').addClass('textae-control__separator')];
                    $.each(params, function(buttonType, title) {
                        group.push(btn(buttonType, title));
                    });
                    return group;
                };

                return $('<span>').append(
                    [{
                        'read': 'Access [A]',
                        'write': 'Save [S]'
                    }, {
                        'undo': 'Undo [Z]',
                        'redo': 'Redo [X]'
                    }, {
                        'replicate': 'Replicate span annotation [R]',
                        'replicate-auto': 'Auto replicate (Toggle)'
                    }, {
                        'entity': 'New entity [E]',
                        'pallet': 'Select label [Q]',
                        'change-label': 'Change label [W]'
                    }, {
                        'delete': 'Delete [D]',
                        'copy': 'Copy [C]',
                        'paste': 'Paste [V]'
                    }, {
                        'setting': 'Setting'
                    }, {
                        'help': 'Help [H]',
                        'about': 'About'
                    }].map(btnGroup).reduce(function(x, y) {
                        // [[A, B],[C, D]] > [A, B, C, D]
                        return x.concat(y);
                    }));
            };

            $self.append(makeTitle())
                .append(makeIconBar());
        };

        // A function to enable/disable button.
        var enableButton = function(buttonName, enable) {
            if (arguments.length === 1) {
                // A parameter can be spesified by object like { 'buttonName': true }.
                $.each(arguments[0], function(buttonName, enable) {
                    enableButton(buttonName, enable);
                });
            } else if (arguments.length === 2) {
                // Set apearance and eventHandler to button.
                var button = buttonCache[buttonName];
                var event = 'click';
                var eventHandler = function(e) {
                    // The buttonClick is an eventHandler appended by the tool.
                    this.buttonClick({
                        name: button.eventName,
                        point: {
                            top: e.clientY - this.get(0).offsetTop,
                            left: e.clientX - this.get(0).offsetLeft
                        }
                    });
                }.bind(this);

                if (button) {
                    if (enable) {
                        button.instance
                            .off(event)
                            .on(event, eventHandler);
                        buttonAppearanceUtil.enable(button.instance);
                    } else {
                        button.instance.off(event);
                        buttonAppearanceUtil.disable(button.instance);
                    }
                }
            }
        }.bind(this);

        // Update all button state, because an instance of textEditor maybe change.
        // Make buttons in a disableButtons disalbed, and other buttons enabled.
        // Values in a disableButtois are ignored.  
        var updateAllButtonEnableState = function(disableButtons) {
            enableButton($.extend({}, buttonCache, disableButtons));
        };

        var updateReplicateAutoButtonPushState = function(isPushed) {
            if (isPushed) {
                buttonAppearanceUtil.push(buttonCache["replicate-auto"].instance);
            } else {
                buttonAppearanceUtil.unpush(buttonCache["replicate-auto"].instance);
            }
        };

        // Cashe has refarence to buttons.
        // This contains buttons and event definitions like as {'buttonName' : { instance: $button, eventName : 'textae.control.button.read.click' }}
        var buttonCache = {};

        // Build elements
        buildElement(this);

        // Enable buttons that always eanable.
        enableButton({
            'read': true,
            'replicate-auto': true,
            'help': true,
            'about': true
        });

        // Public API
        this.updateAllButtonEnableState = updateAllButtonEnableState;
        this.updateReplicateAutoButtonPushState = updateReplicateAutoButtonPushState;

        return this;
    };
    // tool manage interactions between components. 
    var tool = function() {
        // components to manage
        var components = {
            control: null,
            // a container of editors that is extended from Array. 
            editors: $.extend([], {
                getNewId: function() {
                    return 'editor' + this.length;
                },
                select: function(editor) {
                    this.selected = editor;
                    console.log(editor.editorId);
                },
                selectFirst: function() {
                    this.select(this[0]);
                },
                selected: null,
            }),
            infoModals: {
                //help dialog
                help: textAeUtil.makeInformationModal({
                    className: 'textae-control__help',
                    addContentsFunc: function() {
                        this
                            .append($('<h3>').text('Help (Keyboard short-cuts)'))
                            .append($('<div>').addClass('textae-tool__key-help'));
                    }
                }),
                //about dialog
                about: textAeUtil.makeInformationModal({
                    className: 'textae-control__about',
                    addContentsFunc: function() {
                        this
                            .html('<h3>About TextAE (Text Annotation Editor)</h3>' +
                                '<p>今ご覧になっているTextAEはPubAnnotationで管理しているアノテーションのビューアもしくはエディタです。</p>' +
                                '<p>PubAnnotationではPubMedのアブストラクトにアノテーションを付けることができます。</p>' +
                                '<p>現在はEntrez Gene IDによる自動アノテーションおよびそのマニュアル修正作業が可能となっています。' +
                                '今後は自動アノテーションの種類を増やす計画です。</p>' +
                                '<p>間違ったアノテーションも目に付くと思いますが、それを簡単に直して自分のプロジェクトにセーブできるのがポイントです。</p>' +
                                '<p>自分のアノテーションを作成するためにはPubAnnotation上で自分のプロジェクトを作る必要があります。' +
                                '作成したアノテーションは後で纏めてダウンロードしたり共有することができます。</p>' +
                                '<p>まだ開発中のサービスであり、実装すべき機能が残っています。' +
                                'ユーザの皆様の声を大事にして開発していきたいと考えておりますので、ご意見などございましたら教えていただければ幸いです。</p>');
                    }
                }),
                hideAll: function() {
                    components.infoModals.help.hide();
                    components.infoModals.about.hide();
                },
            },
        };

        // decide "which component handles certain event.""
        var eventDispatcher = {
            handleKeyInput: function(key) {
                if (key === 'H') {
                    components.infoModals.help.show();
                } else {
                    if (components.editors.selected) {
                        components.editors.selected.api.handleKeyInput(key);
                    }
                    if (key === 'ESC') {
                        components.infoModals.hideAll();
                    }
                }
            },
            handleButtonClick: function(event) {
                switch (event.name) {
                    case 'textae.control.button.help.click':
                        components.infoModals.help.show();
                        break;
                    case 'textae.control.button.about.click':
                        components.infoModals.about.show();
                        break;
                    default:
                        if (components.editors.selected) {
                            components.editors.selected.api.handleButtonClick(event);
                        }
                }
            },
            //methods for editor to call tool.
            handleEditor: {
                select: function(editor) {
                    components.editors.select(editor);
                },
                cancel: function() {
                    components.infoModals.hideAll();
                },
                changeButtonState: function(disableButtons) {
                    components.control.updateAllButtonEnableState(disableButtons);
                },
                pushReplicateAuto: function(push) {
                    components.control.updateReplicateAutoButtonPushState(push);
                },
            },
        };

        //controller observe user input.
        var controller = function() {
            // observe key-input events and convert events to readable code.
            var observeKeybordInput = function() {
                //declare keyApiMap of cotorol keys 
                var controlKeyEventMap = {
                    27: 'ESC',
                    46: 'DEL',
                    37: 'LEFT',
                    39: 'RIGHT'
                };
                var convertKeyEvent = function(keyCode) {
                    if (65 <= keyCode && keyCode <= 90) {
                        //from a to z, convert 'A' to 'Z'
                        return String.fromCharCode(keyCode);
                    } else if (controlKeyEventMap[keyCode]) {
                        //control key, like ESC, DEL ...
                        return controlKeyEventMap[keyCode];
                    }
                };

                //observe key-input event
                var isActive = true;
                var onKeyup = function(e) {
                    if (isActive) {
                        eventDispatcher.handleKeyInput(convertKeyEvent(e.keyCode));
                    }
                };
                $(document).on('keyup', onKeyup);

                //keybord disable/enable if jquery ui dialog is open/close
                $('body').on('dialogopen', '.ui-dialog', function() {
                    isActive = false;
                }).on('dialogclose', '.ui-dialog', function() {
                    isActive = true;
                });
            };

            // observe window-resize event and redraw all editors. 
            var observeWindowResize = function() {
                // bind resize event
                $(window).on('resize', function() {
                    //Call redraw when the window resize is end. Because resize-event is occuerd multiply during resize the window.
                    var redrawTimer;

                    return function() {
                        //Cancel the redrawTimer if redrawTimer is set alredy
                        if (redrawTimer) {
                            window.clearTimeout(redrawTimer);
                        }

                        redrawTimer = window.setTimeout(function() {
                            //Call all editors
                            components.editors.forEach(function(e) {
                                e.api.redraw();
                            });
                        }, 200);
                    };
                }());
            };

            //start observe at document ready, because this function may be called before body is loaded.
            $(function() {
                observeKeybordInput();
                observeWindowResize();
            });
        }();

        return {
            // register a control to tool.
            setControl: function(control) {
                $.extend(control, {
                    buttonClick: function(buttonEvent) {
                        eventDispatcher.handleButtonClick(buttonEvent);
                    },
                });

                components.control = control;
            },
            // register editors to tool
            pushEditor: function(editor) {
                components.editors.push(editor);

                $.extend(editor, {
                    editorId: components.editors.getNewId(),
                    tool: {
                        selectMe: eventDispatcher.handleEditor.select.bind(this, editor),
                        cancelSelect: eventDispatcher.handleEditor.cancel,
                        changeButtonState: eventDispatcher.handleEditor.changeButtonState,
                        pushReplicateAuto: eventDispatcher.handleEditor.pushReplicateAuto,
                    },
                });
            },
            // select first editor
            selectFirstEditor: function() {
                components.editors.selectFirst();
            },
        };
    }();
    jQuery.fn.textae = (function() {
        return function() {
            if (this.hasClass("textae-editor")) {
                this.each(function() {
                    var e = $(this);
                    tool.pushEditor(e);
                    editor.apply(e);
                    e.api.start();
                    return e;
                });
                tool.selectFirstEditor();
            } else if (this.hasClass("textae-control")) {
                var c = control.apply(this);
                tool.setControl(c);
                return c;
            }
        };
    })();
    // Application main
    $(function() {
        //setup contorl
        $(".textae-control").textae();

        //setup editor
        $(".textae-editor").textae();
    });
})(jQuery);